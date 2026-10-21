/**
 * Shared per-visit rotation for Courses page tile sections
 * (BRIEF_COURSES_REGION_TILES_ROTATION). Shuffle, prefer ids not shown last
 * visit, then return the chosen items in the pool's ORIGINAL order — callers
 * pass a pool already sorted the way the tiles should read.
 */
export function pickRotating<T>(pool: T[], getId: (t: T) => string, previousIds: string[], count: number, rand: () => number = Math.random): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const seen = new Set(previousIds);
  const chosen = new Set([
    ...shuffled.filter((t) => !seen.has(getId(t))),
    ...shuffled.filter((t) => seen.has(getId(t))),
  ].slice(0, count));
  return pool.filter((t) => chosen.has(t));
}

/** localStorage id memory; every access guarded, unavailable storage reads []. */
export function readRotationIds(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
export function writeRotationIds(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* storage unavailable */ }
}
