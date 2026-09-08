/**
 * THE FULL RANKING (BRIEF_TOUR_REBUILD).
 *
 * The see-all destination for block 1. A season board runs to 219 rows, so it
 * gets a page of its own rather than expanding inside a four-block hub: a member
 * who taps out of curiosity keeps Our Picks, Coming Up and the wire.
 *
 * SAME ROW, SAME MARKS, SAME FIGURES as the block — BoardRow is imported, not
 * restated, so the two readings of the same board cannot drift. Players carry
 * the round mark, schools the square one.
 *
 * THIS PAGE STATES ITS BASIS in the count line, exactly as the block does.
 * The header owns the safe area; the foot pays NAV_CLEARANCE.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { DISCOVER_QUIET, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { FONT, INK } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

import { BoardRow } from './TourLeaderboardBlock';
import { BOARD_LABEL, useTourBoardState, type TourBoardKey } from './useTourBoardState';

const CANVAS = '#0D0F14';
const BOARD_KEYS: TourBoardKey[] = ['live', 'fedex', 'rtd', 'oom', 'cme', 'livpts', 'colleges'];
const TOUR_KEYS: TourId[] = ['pga', 'euro', 'lpga', 'liv', 'pgad', 'champ'];

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

export default function TourRankingsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const askedBoard = params.get('board') as TourBoardKey | null;
  const askedTour = params.get('tour') as TourId | null;
  const board = askedBoard && BOARD_KEYS.includes(askedBoard) ? askedBoard : 'fedex';
  const tour = askedTour && TOUR_KEYS.includes(askedTour) ? askedTour : 'pga';

  const state = useTourBoardState(tour, () => {}, board);
  const { rows, total, basis, figureLabel, liveTournament } = state;

  useEffect(() => {
    analyticsEvents.track('tour_rankings_viewed', { board: state.board, total });
  }, [state.board, total]);

  const title = state.board === 'live' ? liveTournament?.name ?? BOARD_LABEL.live : BOARD_LABEL[state.board];
  const subject = state.board === 'colleges' ? 'schools' : 'players';

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: CANVAS,
          borderBottom: '0.5px solid rgba(255,255,255,0.12)',
          padding: `max(env(safe-area-inset-top, 0px), 47px) 14px 0`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            border: 0,
            background: 'transparent',
            padding: 0,
            color: INK,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} strokeWidth={1.6} />
        </button>
        <span style={{ ...KICKER, height: 44, display: 'flex', alignItems: 'center', color: INK }}>
          {title}
        </span>
      </header>

      <main style={{ padding: `12px 14px ${NAV_CLEARANCE}`, fontFamily: SANS }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            ...KICKER,
            color: DISCOVER_QUIET,
            paddingBottom: 8,
          }}
        >
          <span>{total > 0 ? `${total.toLocaleString()} ${subject}${basis ? ` \u00b7 ${basis}` : ''}` : ''}</span>
          {figureLabel && <span>{figureLabel}</span>}
        </div>

        {rows.map((row) => (
          <BoardRow
            key={`${state.board}:${row.id}:${row.pos}`}
            row={row}
            onPress={() =>
              navigate(row.mark === 'square' ? `/tourhub/college-golf/${row.id}` : `/tourhub/player/${row.id}`)
            }
          />
        ))}
      </main>
    </div>
  );
}
