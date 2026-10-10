import { DOCUMENTS, type Document } from "./documents";
import { cosine, embedQuery } from "./embed";
import { normalizeArabic } from "./normalize";
import { compareId, reciprocalRankFusion } from "./rrf";
import type { MatchMethod, SearchResult } from "./types";

export const DEFAULT_MATCH_COUNT = 8;
export const MAX_MATCH_COUNT = 20;
export const CANDIDATE_LIMIT = 20;
export const VECTOR_MATCH_MIN = 0.55;

export function clampMatchCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MATCH_COUNT;
  return Math.min(MAX_MATCH_COUNT, Math.max(1, Math.floor(value)));
}

function lexicalRank(document: Document, tokens: readonly string[]): number {
  const words = normalizeArabic(`${document.title} ${document.body}`)
    .split(" ")
    .filter(Boolean);
  let rank = 0;
  for (const token of tokens) {
    let count = 0;
    for (const word of words) {
      if (word === token) count += 1;
    }
    if (count === 0) return 0;
    rank += count;
  }
  return rank;
}

function methodFor(hasLexical: boolean, hasVector: boolean): MatchMethod {
  if (hasLexical && hasVector) return "hybrid";
  if (hasLexical) return "fulltext";
  return "vector";
}

export function hybridSearch(
  query: string,
  options?: { matchCount?: number },
): SearchResult[] {
  const matchCount = clampMatchCount(options?.matchCount ?? DEFAULT_MATCH_COUNT);
  const normalized = normalizeArabic(query);
  if (!normalized) return [];

  const tokens = normalized.split(" ").filter(Boolean);
  const lexical = DOCUMENTS.map((document) => ({
    document,
    rank: lexicalRank(document, tokens),
  }))
    .filter((entry) => entry.rank > 0)
    .sort(
      (left, right) =>
        right.rank - left.rank || compareId(left.document.id, right.document.id),
    )
    .slice(0, CANDIDATE_LIMIT);

  const queryEmbedding = embedQuery(query);
  const vector = DOCUMENTS.map((document) => ({
    document,
    similarity: cosine(queryEmbedding, document.embedding),
  }))
    .filter((entry) => entry.similarity >= VECTOR_MATCH_MIN)
    .sort(
      (left, right) =>
        right.similarity - left.similarity ||
        compareId(left.document.id, right.document.id),
    )
    .slice(0, CANDIDATE_LIMIT);

  const lexicalById = new Map(lexical.map((entry) => [entry.document.id, entry.rank]));
  const vectorById = new Map(vector.map((entry) => [entry.document.id, entry.similarity]));
  const documentsById = new Map(DOCUMENTS.map((document) => [document.id, document]));

  return reciprocalRankFusion([
    lexical.map((entry) => entry.document.id),
    vector.map((entry) => entry.document.id),
  ])
    .slice(0, matchCount)
    .flatMap((ranked) => {
      const document = documentsById.get(ranked.id);
      if (!document) return [];
      const ftsRank = lexicalById.get(document.id) ?? null;
      const vectorSimilarity = vectorById.get(document.id) ?? null;
      return [
        {
          id: document.id,
          title: document.title,
          body: document.body,
          language: document.language,
          topics: [...document.topics],
          ftsRank,
          vectorSimilarity,
          rrfScore: ranked.score,
          matchedBy: methodFor(ftsRank !== null, vectorSimilarity !== null),
        },
      ];
    });
}
