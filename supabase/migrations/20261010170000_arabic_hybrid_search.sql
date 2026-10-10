-- Arabic hybrid search: orthographic normalisation, a generated tsvector,
-- pgvector, and reciprocal rank fusion.
--
-- Demo embeddings are 32-dimensional topic vectors (see lib/embed.ts).
-- RRF uses k = 60. A vector hit must clear cosine similarity 0.55.
-- The in-memory ranker mirrors the `simple` text search config on purpose:
-- the built-in `arabic` config can be substituted later if you want its stemmer.

create extension if not exists vector;

-- Code-point walk, matching lib/normalize.ts. Arabic regex ranges are avoided
-- because they depend on the database collation.
create or replace function public.normalize_arabic(input text)
returns text
language plpgsql
immutable
parallel safe
set search_path = pg_catalog
as $$
declare
  source text := coalesce(input, '');
  result text := '';
  index integer := 1;
  length integer := char_length(source);
  character text;
  code integer;
  spacing boolean;
begin
  while index <= length loop
    character := substr(source, index, 1);
    code := ascii(character);
    index := index + 1;

    -- tashkeel, tatweel, superscript alef, Quranic marks: delete, do not split the word
    if code between 1552 and 1562
      or code = 1600
      or code between 1611 and 1631
      or code = 1648
      or code between 1750 and 1773
    then
      continue;
    end if;

    if code in (1570, 1571, 1573, 1649) then
      character := 'ا';
      code := 1575;
    elsif code = 1609 then
      character := 'ي';
      code := 1610;
    elsif code = 1577 then
      character := 'ه';
      code := 1607;
    elsif code between 65 and 90 then
      character := chr(code + 32);
      code := code + 32;
    end if;

    spacing := code = 9 or code = 10 or code = 13 or code = 32
      or not (
        code between 1569 and 1594
        or code between 1601 and 1610
        or code between 1632 and 1641
        or code between 48 and 57
        or code between 97 and 122
      );

    if spacing then
      if result <> '' and right(result, 1) <> ' ' then
        result := result || ' ';
      end if;
    else
      result := result || character;
    end if;
  end loop;

  return btrim(result);
end;
$$;

comment on function public.normalize_arabic(text) is
  'Strip Arabic diacritics and tatweel, fold alef variants, map ى to ي and ة to ه, lowercase ASCII.';

create table public.documents (
  id text primary key,
  title text not null,
  body text not null,
  language text not null check (language in ('ar', 'en')),
  topics text[] not null default '{}',
  embedding vector(32),
  search_text text generated always as (
    public.normalize_arabic(title || ' ' || body)
  ) stored,
  search_vector tsvector generated always as (
    to_tsvector('simple', public.normalize_arabic(title || ' ' || body))
  ) stored
);

create index documents_search_vector_gin_idx
  on public.documents
  using gin (search_vector);

create index documents_embedding_hnsw_idx
  on public.documents
  using hnsw (embedding vector_cosine_ops);

create or replace function public.hybrid_search(
  query text,
  query_embedding vector,
  match_count integer default 8
)
returns table (
  id text,
  title text,
  body text,
  language text,
  topics text[],
  fts_rank real,
  vector_similarity real,
  rrf_score real,
  matched_by text
)
language sql
stable
set search_path = public, extensions
as $$
  with params as (
    select
      plainto_tsquery('simple', public.normalize_arabic(query)) as tsq,
      least(greatest(coalesce(match_count, 8), 1), 20) as lim
  ),
  fts as (
    select
      ranked.id,
      ranked.rank,
      row_number() over (order by ranked.rank desc, ranked.id) as rnk
    from (
      select
        d.id,
        ts_rank_cd(d.search_vector, p.tsq)::real as rank
      from public.documents d
      cross join params p
      where numnode(p.tsq) > 0
        and d.search_vector @@ p.tsq
      order by rank desc, d.id
      limit 20
    ) ranked
  ),
  vec as (
    select
      ranked.id,
      ranked.similarity,
      row_number() over (order by ranked.similarity desc, ranked.id) as rnk
    from (
      select
        d.id,
        (1 - (d.embedding <=> query_embedding))::real as similarity
      from public.documents d
      where query_embedding is not null
        and d.embedding is not null
      order by d.embedding <=> query_embedding, d.id
      limit 20
    ) ranked
    where ranked.similarity >= 0.55
  ),
  fused as (
    select
      coalesce(f.id, v.id) as id,
      f.rank as fts_rank,
      v.similarity as vector_similarity,
      (
        coalesce(1.0 / (60 + f.rnk), 0)
        + coalesce(1.0 / (60 + v.rnk), 0)
      )::real as rrf_score,
      case
        when f.id is not null and v.id is not null then 'hybrid'
        when f.id is not null then 'fulltext'
        else 'vector'
      end as matched_by
    from fts f
    full outer join vec v on v.id = f.id
  )
  select
    d.id,
    d.title,
    d.body,
    d.language,
    d.topics,
    fused.fts_rank,
    fused.vector_similarity,
    fused.rrf_score,
    fused.matched_by
  from fused
  join public.documents d on d.id = fused.id
  order by fused.rrf_score desc, d.id
  limit (select lim from params);
$$;

comment on function public.hybrid_search(text, vector, integer) is
  'Fuse full-text rank and cosine similarity with reciprocal rank fusion (k = 60).';

alter table public.documents enable row level security;

create policy documents_public_read
  on public.documents
  for select
  using (true);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.documents to anon;
    grant execute on function public.hybrid_search(text, vector, integer) to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on public.documents to authenticated;
    grant execute on function public.hybrid_search(text, vector, integer) to authenticated;
  end if;
end $$;
