/**
 * islandEdge — single source of truth for "is content currently passing under
 * the island?" on bleed routes.
 *
 * The Clubhouse feed (CardFeed) ALREADY runs one passive, rAF-coalesced scroll
 * listener for active-card tracking. It publishes into this store from that
 * same handler — DO NOT add a second scroll listener anywhere to drive the
 * island edge.
 */
let scrolled = false;
const listeners = new Set<() => void>();

export function setIslandEdgeScrolled(next: boolean): void {
  if (next === scrolled) return;
  scrolled = next;
  listeners.forEach((l) => l());
}

export function getIslandEdgeScrolled(): boolean {
  return scrolled;
}

export function subscribeIslandEdge(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
