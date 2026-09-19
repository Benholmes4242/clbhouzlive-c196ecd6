import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { restoreAmateurScroll, takeAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { ExploreMagazine } from '@/features/explore-magazine/ExploreMagazine';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDiscoverLastSeen, useMarkDiscoverSeenOnExit } from '@/hooks/useDiscoverLastSeen';
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { NAV_CLEARANCE } from '@/lib/navClearance';

import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * THE AMATEUR PAGE — now the MAGAZINE (BRIEF_EXPLORE_MAGAZINE, PHASE A).
 *
 * ONE RANKED STREAM OF ONE UNIT. The previous composition — hero, filter rail,
 * leaderboard, courses block, amateur news, media block — no longer renders
 * here. NOTHING WAS DELETED: `AmateurHero`, `AmateurFilterRail`,
 * `AmateurLeaderboardBlock`, `AmateurCoursesBlock`, `AmateurNewsBlock`,
 * `AmateurMediaBlock`, `useAmateurBoardState` and `BoardFilterPanel` remain on
 * disk. PHASE B (P1, Sep 2026) HAS DRAWN THE BOARD BACK IN: Scores is now a
 * chip that can change what you see — `useAmateurBoardState`,
 * `AmateurLeaderboardBlock` and `BoardFilterPanel` are LIVE on the Scores view
 * of ExploreMagazine, behind a picker pinned to the scope row. The ranked
 * stream stays the default; board state is page-local. The remaining blocks
 * are DEAD FROM THIS PAGE ONLY, and the retirement pass is Phase E.
 *
 * WHAT SURVIVES UNCHANGED: the route ('/amateur'), the `amateur_*` event prefix
 * (an event name is not a label, and the Discover baseline comparison depends on
 * it), the scroll memory, the scorecard opener and its round sheet, and the
 * shared floating glass islands — this page owns no header.
 */
export default function AmateurPage() {
  const { user } = useSupabaseSession();
  const opener = useScorecardOpener();

  useEffect(() => {
    analyticsEvents.track('amateur_page_viewed', {});
  }, []);

  /* THE LAST-LOOK STAMP IS WRITTEN HERE, AND NOWHERE ELSE.
     Explore READS surface_key 'discover' through get_viewer_standing (the
     "then" ranking behind every rank card and every movement chip), and until
     now NOTHING wrote it: the stamp was frozen wherever the retired Discover
     surface last left it, so the window only ever widened.

     THE SAME KEY IS READ AND WRITTEN. useDiscoverLastSeen owns the single
     SURFACE_KEY = 'discover' constant used by both the read and the
     mark_surface_seen call, so the two cannot drift apart.

     ON EXIT, NEVER ON ARRIVAL. Writing on arrival would clear the markers
     before they could be read. useMarkDiscoverSeenOnExit fires on
     visibilitychange -> hidden (the dependable background signal in the
     Median WebView), on pagehide, and on unmount (route change away). The
     RPC is monotonic through GREATEST and clamps future stamps, so a stale
     tab cannot move the window backwards. */
  const { markSeen } = useDiscoverLastSeen(user?.id);
  const queryClient = useQueryClient();
  /* MOVING THE STAMP INVALIDATES EVERY ANSWER MEASURED FROM IT. Standing and
     the stream are cached for five minutes AND persisted, so without this the
     next visit would re-render movement the member has already been shown.
     Removed rather than invalidated: nothing is mounted at this point. */
  const markSeenAndForget = useCallback(() => {
    markSeen();
    queryClient.removeQueries({ queryKey: ['explore-magazine'] });
  }, [markSeen, queryClient]);
  useMarkDiscoverSeenOnExit(markSeenAndForget);

  /* COMING BACK IS FREE. A see-all, a course row or a story leaves the page;
     returning lands on the row that was tapped, not the first card. */
  const returnTo = useRef<number | null>(takeAmateurScroll());
  useLayoutEffect(() => {
    const y = returnTo.current;
    returnTo.current = null;
    if (y == null || y < 2) return;
    return restoreAmateurScroll(y);
  }, []);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, ...FIGS }}>
      {/* TOP CLEARANCE: CHROME_CLEARANCE, the twin of NAV_CLEARANCE — the
          island row measures itself (safe-area inclusive, from the island's
          BOTTOM edge) and the first content starts below it. NOT an immersive
          route: a card photo under the islands reads as the page failing to
          start (BRIEF_EXPLORE_MAGAZINE §3a correction). The shell pays
          var(--sat); this page never does. */}
      <main style={{ padding: `${CHROME_CLEARANCE} 0 ${NAV_CLEARANCE}` }}>
        <ExploreMagazine userId={user?.id} />
      </main>

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}

