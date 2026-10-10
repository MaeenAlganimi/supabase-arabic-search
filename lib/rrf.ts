export const RRF_K = 60;

export type RankedId = {
  id: string;
  score: number;
};

export function compareId(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Reciprocal rank fusion. `rankings` are best-first id lists.
 * Score(d) = Σ 1 / (k + rank), with rank starting at 1.
 * A duplicate id inside one list keeps its first (best) position.
 */
export function reciprocalRankFusion(
  rankings: readonly (readonly string[])[],
  k = RRF_K,
): RankedId[] {
  const scores = new Map<string, number>();

  for (const ranking of rankings) {
    const seen = new Set<string>();
    let rank = 0;
    for (const id of ranking) {
      if (seen.has(id)) continue;
      seen.add(id);
      rank += 1;
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank));
    }
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((left, right) => right.score - left.score || compareId(left.id, right.id));
}
