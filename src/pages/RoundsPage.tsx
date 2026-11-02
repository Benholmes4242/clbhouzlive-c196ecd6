import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import type { RoundPressTarget } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { ScoresLeaderboardsPage } from '@/features/explore-magazine/ScoresLeaderboardsPage';
import { UnknownConnectionFallback } from '@/features/explore-magazine/UnknownConnectionFallback';
import { useAmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * THE ROUNDS PAGE (RS §1, mock B) — today's ScoresLeaderboardsPage as its own
 * page, mounted exactly as ExploreMagazine mounted it: same board state, same
 * row/member/course handlers, same scorecard opener and sheet, same gate for
 * members without a synced handicap. The header is the Find people / Edit
 * profile pattern; chrome-v2 registers the route with no shared chrome (mock
 * wins over the brief's "same chrome as /amateur" — ruled 2026-11-02).
 *
 * Top clearance is the header's own safe-area padding, NOT CHROME_CLEARANCE:
 * that token includes the island row's height and this page has no islands.
 * Bottom clearance stays NAV_CLEARANCE, as on /amateur.
 */

/* CB44 — the same session hold AmateurPage uses: a return visit must not
   flash signed-out while the session hook re-resolves. */
let lastResolved: { userId: string | undefined } | null = null;

export default function RoundsPage() {
  const live = useSupabaseSession();
  if (!live.loading) lastResolved = { userId: live.user?.id };
  const sessionKnown = !live.loading || lastResolved !== null;
  const user = live.loading ? (lastResolved?.userId ? { id: lastResolved.userId } : null) : live.user;

  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const opener = useScorecardOpener();
  /* Always active: this page IS the board, as the Scores view was. */
  const boardState = useAmateurBoardState(user?.id, true);

  useEffect(() => {
    analyticsEvents.track('rounds_page_viewed', {});
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/amateur');
  }, [navigate]);

  /* A board row opens its round in the sheet; a member-only row opens the
     member — the same rule ExploreMagazine's boardRowPress used. */
  const onRowPress = useCallback(
    (row: RoundPressTarget) => {
      if (row.whs_score_id) opener.openByScore(row.whs_score_id, null, row.user_id);
      else opener.openProfile(row.user_id);
    },
    [opener],
  );

  return (
    <div data-rounds-page="" style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, color: A.INK, ...FIGS }}>
      {/* Find people / Edit profile header: 36px round back, centred 17/700. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 0',
          minHeight: 'calc(env(safe-area-inset-top, 0px) + 50px)',
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={goBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'none',
            color: A.INK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', marginRight: 36, fontSize: 17, fontWeight: 700 }}>
          {t('amateur.roundsPage.title', 'Rounds')}
        </div>
      </header>

      <main style={{ padding: `0 0 ${NAV_CLEARANCE}` }}>
        {/* CB46 — instrumentation only; renders nothing. */}
        <UnknownConnectionFallback userId={user?.id} />
        <ScoresLeaderboardsPage
          userId={user?.id}
          sessionKnown={sessionKnown}
          state={boardState}
          onRowPress={onRowPress}
          onMemberTap={(id) => opener.openProfile(id)}
          onOpenCourse={(id) => navigate(`/courses/${id}`)}
        />
      </main>

      {/* The sheet belongs to THIS page's opener — the lesson of the
          AmateurPage/ExploreMagazine two-opener fault. */}
      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
      <ScrollToTopGlass />
    </div>
  );
}
