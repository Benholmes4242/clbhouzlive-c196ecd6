/**
 * Lightweight event bus to open the All Trophies sheet from anywhere
 * (page top-bar Trophy icon, HeroHandicapCard "View N trophies" link).
 *
 * The actual sheet is mounted inside HandicapDashboard via TrophiesSheetMount,
 * which owns the open/close state and computes the achievements list.
 */
const listeners = new Set<() => void>();

export function openTrophiesSheet(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeOpenTrophies(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
