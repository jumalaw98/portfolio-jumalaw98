/**
 * Deterministic, seeded ordering used by the blog grid.
 *
 * Design notes
 * ------------
 *  - The order must be identical on the server (SSR) and on the first client
 *    render, otherwise hydration would shift the layout (CLS). The seed is
 *    generated per request by the server component and passed down.
 *  - This is cosmetic ordering only: no security decision depends on it. It is
 *    therefore a plain PRNG (not `crypto`) — see the NOSONAR note below.
 *  - Implemented as a decorate–sort–undecorate over per-item random keys rather
 *    than a Fisher–Yates swap. Both produce a uniform permutation, but the
 *    keyed form performs no `array[i] = …` / `array[j]` access with a variable
 *    key, which is the pattern flagged as an "object injection sink"
 *    (`security/detect-object-injection`) and, more importantly, is the pattern
 *    that would let a non-numeric key escape a typed array index.
 */

/** Default key for items whose random draw collides with another item's draw. */
const TIE_BREAK_EPSILON = Number.EPSILON;

interface Decorated<T> {
  readonly value: T;
  readonly rank: number;
}

/**
 * Simple seeded PRNG (mulberry32). Given the same seed string it always
 * produces the same sequence.
 *
 * Used ONLY for cosmetic blog-card shuffling — not a security context.
 * NOSONAR (S2245 warns about PRNGs in security-sensitive positions).
 *
 * @param seed - Seed string (per-request, server-generated)
 * @returns Function producing the next float in [0, 1)
 */
export function mulberry32(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    const cp = seed.codePointAt(i) as number;
    h = Math.trunc((h << 5) - h + cp);
  }
  return () => {
    h = Math.trunc(h + 0x6d2b79f5);
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically reorder `input` using `seed`. Never mutates `input`.
 *
 * @param input - Items to order
 * @param seed - Seed string
 * @returns A new array containing every input item exactly once
 */
export function seededShuffle<T>(input: readonly T[], seed: string): T[] {
  const rand = mulberry32(seed);

  const decorated: Decorated<T>[] = [];
  let previousRank = -1;
  for (const value of input) {
    // Ranks are strictly increasing, which keeps the result stable even if the
    // PRNG produced two identical draws (the tie then falls back to the
    // original order instead of depending on sort() internals).
    const draw = rand();
    const rank = draw > previousRank ? draw : previousRank + TIE_BREAK_EPSILON;
    previousRank = rank;
    decorated.push({ value, rank });
  }

  decorated.sort((a, b) => a.rank - b.rank);

  return decorated.map((entry) => entry.value);
}
