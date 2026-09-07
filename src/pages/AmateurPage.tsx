import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppHeader } from '@/components/chrome/AppHeader';
import { BoardFilterPanel } from '@/components/explore-tab-new/courseled/BoardFilterPanel';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { AmateurFilterRail } from '@/features/amateur/AmateurFilterRail';
import { AmateurHero } from '@/features/amateur/AmateurHero';
import { AmateurLeaderboardBlock } from '@/features/amateur/AmateurLeaderboardBlock';
import { useAmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
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
 */
export default function AmateurPage() {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const state = useAmateurBoardState(user?.id);

  useEffect(() => {
    analyticsEvents.track('amateur_page_viewed', {});
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

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, ...FIGS }}>
      <AppHeader inset="self" overHero heightVar="--amateur-header-h" />
      <AmateurHero userId={user?.id} />

      <main style={{ padding: '14px 14px 88px' }}>
        <AmateurFilterRail filters={state.filters} onOpen={state.openPanel} />
        <AmateurLeaderboardBlock userId={user?.id} state={state} onRowPress={handleRow} />
        {/* Blocks 2-4 land here, in order. */}
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
