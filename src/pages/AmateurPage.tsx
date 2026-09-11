import { useEffect, useLayoutEffect, useRef } from 'react';

import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { restoreAmateurScroll, takeAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { ExploreMagazine } from '@/features/explore-magazine/ExploreMagazine';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
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
 * disk, and the board state and filter panel are the parts Phase B draws back
 * in when Scores becomes a chip that can change what you see. They are DEAD
 * FROM THIS PAGE ONLY, and the retirement pass is Phase E.
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
      {/* THE SHARED CLEARANCE, never a page-local number: the floating pill's
          measured height + its gap + the home indicator. */}
      <main style={{ padding: `0 0 ${NAV_CLEARANCE}` }}>
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

