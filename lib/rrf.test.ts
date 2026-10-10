import { describe, expect, it } from "vitest";
import { RRF_K, reciprocalRankFusion } from "./rrf";

describe("reciprocalRankFusion", () => {
  it("uses a one-based rank and the default constant", () => {
    expect(RRF_K).toBe(60);
    const [first] = reciprocalRankFusion([["doc"]]);
    expect(first?.score).toBeCloseTo(1 / 61, 12);
  });

  it("keeps a single list in order", () => {
    const ranked = reciprocalRankFusion([["a", "b", "c"]]);
    expect(ranked.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(ranked[1]?.score).toBeCloseTo(1 / (RRF_K + 2), 12);
  });

  it("promotes a document that appears in both lists", () => {
    const ranked = reciprocalRankFusion([
      ["only-lexical", "shared"],
      ["shared"],
    ]);
    expect(ranked[0]?.id).toBe("shared");
    expect(ranked[0]?.score).toBeCloseTo(1 / (RRF_K + 2) + 1 / (RRF_K + 1), 12);
    expect(ranked[1]?.id).toBe("only-lexical");
  });

  it("breaks equal scores by id", () => {
    const ranked = reciprocalRankFusion([
      ["b", "a"],
      ["a", "b"],
    ]);
    expect(ranked.map((row) => row.id)).toEqual(["a", "b"]);
    expect(ranked[0]?.score).toBe(ranked[1]?.score);
  });

  it("honours a custom k and ignores duplicate ids in one list", () => {
    const once = reciprocalRankFusion([["a", "b"]], 10);
    const duplicated = reciprocalRankFusion([["a", "a", "b"]], 10);
    expect(once[0]?.score).toBeCloseTo(1 / 11, 12);
    expect(duplicated).toEqual(once);
  });

  it("returns nothing for empty rankings", () => {
    expect(reciprocalRankFusion([])).toEqual([]);
    expect(reciprocalRankFusion([[], []])).toEqual([]);
  });
});
