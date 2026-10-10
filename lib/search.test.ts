import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DOCUMENTS } from "./documents";
import { EMBEDDING_DIM, cosine, embedDocument, embedQuery } from "./embed";
import { hybridSearch } from "./search";

function ids(query: string): string[] {
  return hybridSearch(query).map((result) => result.id);
}

describe("hybridSearch", () => {
  it("loads the hand-written bilingual corpus", () => {
    expect(DOCUMENTS).toHaveLength(30);
    expect(new Set(DOCUMENTS.map((document) => document.id)).size).toBe(30);
    expect(DOCUMENTS.every((document) => document.embedding.length === EMBEDDING_DIM)).toBe(
      true,
    );
  });

  it("puts the same topic on the same vector and different topics apart", () => {
    const dates = DOCUMENTS.find((document) => document.id === "dates-oasis-ar");
    expect(dates).toBeDefined();
    expect(cosine(embedQuery("تمر"), dates?.embedding ?? [])).toBeGreaterThan(0.99);
    expect(cosine(embedDocument(["coffee"]), embedDocument(["sea"]))).toBe(0);
    expect(cosine(embedQuery("احمد"), dates?.embedding ?? [])).toBeLessThan(0.2);
  });

  it("matches vocalised coffee lexically and English coffee by vector", () => {
    const vocalised = hybridSearch("قَهْوَة");
    const plain = hybridSearch("قهوة");
    expect(vocalised.map((result) => result.id).sort()).toEqual(
      plain.map((result) => result.id).sort(),
    );
    expect(vocalised.find((result) => result.id === "coffee-yemen-ar")?.matchedBy).toBe(
      "hybrid",
    );
    expect(vocalised.find((result) => result.id === "coffee-majlis-ar")?.matchedBy).toBe(
      "hybrid",
    );
    expect(vocalised.find((result) => result.id === "coffee-journey-en")?.matchedBy).toBe(
      "vector",
    );
  });

  it("folds alef forms onto the calligrapher without a vector hit", () => {
    for (const query of ["احمد", "أحمد", "أَحْمَد"]) {
      const results = hybridSearch(query);
      expect(results.map((result) => result.id).sort()).toEqual([
        "margin-note-ar",
        "naskh-ahmad-ar",
      ]);
      expect(results.every((result) => result.matchedBy === "fulltext")).toBe(true);
    }
  });

  it("folds teh marbuta and alef maksura", () => {
    expect(ids("مكتبه")).toContain("margin-note-ar");
    expect(ids("مَكْتَبَة")).toEqual(ids("مكتبة"));
    expect(ids("علي")).toEqual(["rain-threshold-ar"]);
    expect(ids("عَلَى")).toEqual(["rain-threshold-ar"]);
    expect(hybridSearch("علي")[0]?.matchedBy).toBe("fulltext");
  });

  it("keeps the definite article attached", () => {
    const bare = ids("كتاب");
    const prefixed = ids("الكتاب");
    expect(bare).toContain("margin-note-ar");
    expect(bare).not.toContain("grammar-verb-ar");
    expect(prefixed).toContain("grammar-verb-ar");
    expect(prefixed).not.toContain("margin-note-ar");
  });

  it("finds Arabic sea documents from an English coral query", () => {
    const results = hybridSearch("coral");
    expect(results.find((result) => result.id === "coral-gardens-en")?.matchedBy).toBe("hybrid");
    expect(results.find((result) => result.id === "coral-red-sea-ar")?.matchedBy).toBe("vector");
  });

  it("returns nothing for an empty query", () => {
    expect(hybridSearch("   ")).toEqual([]);
    expect(hybridSearch("ًً")).toEqual([]);
  });
});

describe("sql migrations", () => {
  const schema = readFileSync(
    "supabase/migrations/20261010170000_arabic_hybrid_search.sql",
    "utf8",
  );
  const seed = readFileSync(
    "supabase/migrations/20261010170100_seed_documents.sql",
    "utf8",
  );

  it("defines normalisation, the tsvector, both indexes, and RRF", () => {
    expect(schema).toContain("normalize_arabic");
    expect(schema).toContain("to_tsvector('simple'");
    expect(schema).toContain("using gin (search_vector)");
    expect(schema).toContain("using hnsw (embedding vector_cosine_ops)");
    expect(schema).toContain("vector(32)");
    expect(schema).toContain("hybrid_search");
    expect(schema).toContain("1.0 / (60 + f.rnk)");
    expect(schema).toContain("0.55");
  });

  it("seeds every document with the same embedding the demo uses", () => {
    for (const document of DOCUMENTS) {
      expect(seed).toContain(`'${document.id}'`);
    }
    const dates = DOCUMENTS.find((document) => document.id === "dates-oasis-ar");
    expect(seed).toContain(`[${dates?.embedding.join(",")}]`);
  });
});
