import { createClient } from "@supabase/supabase-js";
import { EMBEDDING_DIM, embedQuery } from "./embed";
import { normalizeArabic } from "./normalize";
import { clampMatchCount, hybridSearch } from "./search";
import type { Language, MatchMethod, SearchResponse, SearchResult } from "./types";

type HybridRow = {
  id: string;
  title: string;
  body: string;
  language: Language;
  topics: string[] | null;
  fts_rank: number | null;
  vector_similarity: number | null;
  rrf_score: number;
  matched_by: MatchMethod;
};

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function mapRow(row: HybridRow): SearchResult {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    language: row.language,
    topics: row.topics ?? [],
    ftsRank: row.fts_rank,
    vectorSimilarity: row.vector_similarity,
    rrfScore: row.rrf_score,
    matchedBy: row.matched_by,
  };
}

async function supabaseHybridSearch(query: string, matchCount: number): Promise<SearchResult[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const embedding = embedQuery(query);
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Expected a ${EMBEDDING_DIM}-dimensional query embedding.`);
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // PostgREST casts a string literal to pgvector more reliably than a JSON array.
  const { data, error } = await client.rpc("hybrid_search", {
    query,
    query_embedding: `[${embedding.join(",")}]`,
    match_count: matchCount,
  });

  if (error) throw new Error(error.message);
  return ((data ?? []) as HybridRow[]).map(mapRow);
}

export async function runSearch(query: string, requestedCount = 8): Promise<SearchResponse> {
  const clipped = query.slice(0, 200);
  const normalizedQuery = normalizeArabic(clipped);
  const matchCount = clampMatchCount(requestedCount);
  const mode = hasSupabaseEnv() ? "supabase" : "demo";

  if (!normalizedQuery) {
    return { mode, normalizedQuery, results: [] };
  }

  if (mode === "demo") {
    return { mode, normalizedQuery, results: hybridSearch(clipped, { matchCount }) };
  }

  try {
    return {
      mode,
      normalizedQuery,
      results: await supabaseHybridSearch(clipped, matchCount),
    };
  } catch (error) {
    return {
      mode,
      normalizedQuery,
      results: [],
      error: error instanceof Error ? error.message : "Supabase search failed",
    };
  }
}
