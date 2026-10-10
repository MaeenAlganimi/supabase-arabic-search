export type Language = "ar" | "en";

export type MatchMethod = "fulltext" | "vector" | "hybrid";

export type SearchMode = "demo" | "supabase";

export type SearchResult = {
  id: string;
  title: string;
  body: string;
  language: Language;
  topics: string[];
  ftsRank: number | null;
  vectorSimilarity: number | null;
  rrfScore: number;
  matchedBy: MatchMethod;
};

export type SearchResponse = {
  mode: SearchMode;
  normalizedQuery: string;
  results: SearchResult[];
  error?: string;
};
