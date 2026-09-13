import type { ExploreView } from './useExploreStreamClient';

/**
 * SHARED QUERY KEYS FOR EXPLORE (BRIEF_EXPLORE_MAGAZINE §0).
 *
 * The viewer is IN the key. Every answer this surface gives is about one
 * member — their circle, their standing, their geography — so a cache entry
 * that omits the viewer would hand one member another member's page.
 */
export const exploreKeys = {
  all: ['explore-magazine'] as const,
  stream: (viewerId: string | undefined, view: ExploreView, scope: string) =>
    ['explore-magazine-stream', viewerId ?? 'anon', view, scope] as const,
};

/** queryKey[0] prefix persisted by src/lib/queryPersister.ts (first page only). */
export const EXPLORE_STREAM_PREFIX = 'explore-magazine-stream';
