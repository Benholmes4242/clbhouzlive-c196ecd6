import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


import { BoardFilterPanel } from '@/components/explore-tab-new/courseled/BoardFilterPanel';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { AmateurFilterRail } from '@/features/amateur/AmateurFilterRail';
import { AmateurCoursesBlock } from '@/features/amateur/AmateurCoursesBlock';
import { AmateurHero } from '@/features/amateur/AmateurHero';
import { AmateurLeaderboardBlock } from '@/features/amateur/AmateurLeaderboardBlock';
import { AmateurMediaBlock } from '@/features/amateur/AmateurMediaBlock';
import { AmateurNewsBlock } from '@/features/amateur/AmateurNewsBlock';
import { rememberAmateurScroll, restoreAmateurScroll, takeAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { useAmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { NAV_CLEARANCE } from '@/lib/navClearance';

import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * THE AMATEUR PAGE (BRIEF_AMATEUR_PAGE).
 *
 * One page, one scroll, no tabs. Landed so far: the shell, the over-hero
 * header, the 340px hero and BLOCK 1, the leaderboard. Blocks 2-4 (courses,
 * amateur news, media) follow beneath, one at a time.
 *
 * THE FILTER GOVERNS THE FIRST TWO BLOCKS, so its state lives here and not
 * inside either of them.
 *
 * EVENT NAMES: the `amateur_*` prefix PREDATES the tab's rename to "Explore"
 * and stays. Renaming it would break the comparison against the Discover
 * baseline we are still collecting, and an event name is not a label. The route
 * is likewise still '/amateur' — a deliberate, recorded mismatch.
 */
export default function AmateurPage() {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const state = useAmateurBoardState(user?.id);

  useEffect(() => {
    analyticsEvents.track('amateur_page_viewed', {});
  }, []);

  /* COMING BACK IS FREE. A see-all, a course row or a story leaves the page;
     returning lands on the row that was tapped, not the hero. */
  const returnTo = useRef<number | null>(takeAmateurScroll());
  useLayoutEffect(() => {
    const y = returnTo.current;
    returnTo.current = null;
    if (y == null || y < 2) return;
    return restoreAmateurScroll(y);
  }, []);

  const handleRow = useCallback(
    (row: BoardRow) => {
      analyticsEvents.track('amateur_board_row_tapped', {
        pos: row.pos,
        has_score: !!row.whs_score_id,
      });
      if (row.whs_score_id) opener.openByScore(row.whs_score_id, null, row.user_id);
      else opener.openProfile(row.user_id);
    },
    [opener],
  );

  /* A COURSE ROW IS A LINK: the whole row goes to that course's page. */
  const handleCourse = useCallback(
    (courseId: string) => {
      rememberAmateurScroll();
      navigate(`/courses/${courseId}`);
    },
    [navigate],
  );

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, ...FIGS }}>
      {/* No page-owned header: /amateur wears the shared floating glass
          islands (registry rule), the same object the feed and course detail
          wear. The island pays the notch; the hero bleeds beneath it. */}
      {/* THE HERO OPENS THE ROUND IT NAMES (BRIEF_EXPLORE_HERO_MESSAGING §5),
          through the SAME scorecard opener the leaderboard rows use — so the
          feat named in the kicker is one tap from being visible on the card. */}
      <AmateurHero
        userId={user?.id}
        onOpenRound={(scoreId, roundUserId) => {
          analyticsEvents.track('amateur_hero_round_opened', { has_score: true });
          opener.openByScore(scoreId, null, roundUserId);
        }}
      />

      {/* THE SHARED CLEARANCE, never a page-local number: the floating pill's
          measured height + its 20px gap + 16px breathing + the home indicator.
          When the pill grows, this page moves with it. */}
      {/* §7 ONE TYPE SCALE — the page no longer owns a 14px gutter. Every
          section owns the SHARED 20px gutter through AboutSection; the filter
          rail, which has no heading, pads itself to the same figure. */}
      <main style={{ padding: `18px 0 ${NAV_CLEARANCE}` }}>

        <div style={{ padding: '0 20px' }}>
          <AmateurFilterRail filters={state.filters} onOpen={state.openPanel} />
        </div>
        <AmateurLeaderboardBlock userId={user?.id} state={state} onRowPress={handleRow} />
        <AmateurCoursesBlock userId={user?.id} state={state} onCoursePress={handleCourse} />
        <AmateurNewsBlock />
        <AmateurMediaBlock
          userId={user?.id}
          onSeeAll={(path) => {
            rememberAmateurScroll();
            navigate(path);
          }}
          onDepart={rememberAmateurScroll}
        />
      </main>

      <BoardFilterPanel
        open={state.panelOpen}
        onClose={state.closePanel}
        userId={user?.id}
        board={state.board}
        onBoardChange={state.changeBoard}
        resultCount={state.total}
        filters={state.filters}
        onChange={state.changeFilters}
        facets={state.facets}
      />

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
