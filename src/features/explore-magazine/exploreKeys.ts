import type { ExploreView } from './exploreViewMemory';

/**
 * SHARED QUERY KEYS FOR EXPLORE (BRIEF_EXPLORE_MAGAZINE §0).
 *
 * The viewer is IN the key. Every answer this surface gives is about one
 * member — their circle, their standing, their geography — so a cache entry
 * that omits the viewer would hand one member another member's page.
 */
export const exploreKeys = {
  all: ['explore-magazine'] as const,
  /**
   * GEOGRAPHY IS IN THE KEY (src/lib/queryKeys.ts convention: a key states the
   * identity of the ANSWER, and every input that can change the answer belongs
   * in it). The club, county and country decide the RING on every card, so a
   * key without them cached a null-club page under the same identity as a
   * resolved-club page — the late resolution then changed nothing and never
   * refetched. Waiting for geography alone would fix today's fault and leave
   * the trap set for the next late-resolving input.
   */
  stream: (
    viewerId: string | undefined,
    view: ExploreView,
    scope: string,
    geography?: { clubId?: string | null; county?: string | null; country?: string | null },
  ) =>
    [
      'explore-magazine-stream',
      viewerId ?? 'anon',
      view,
      scope,
      geography?.clubId ?? null,
      geography?.county ?? null,
      geography?.country ?? null,
    ] as const,
};

/** queryKey[0] prefix persisted by src/lib/queryPersister.ts (first page only). */
export const EXPLORE_STREAM_PREFIX = 'explore-magazine-stream';
