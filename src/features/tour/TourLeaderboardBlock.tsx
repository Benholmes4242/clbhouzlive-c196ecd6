/**
 * BLOCK 1 — THE RANKED LEADERBOARD (BRIEF_TOUR_REBUILD).
 *
 * ONE RANKED LIST, five boards behind chips (four out of tournament — the live
 * Leaderboard chip is ABSENT, not greyed, when nothing is in progress).
 *
 * CAPPED WITH A SEE-ALL TO A PUSHED PAGE. Ten positions here; the full ranking
 * opens at /tourhub/rankings. A season board runs to 219 rows and revealing that
 * in place would bury Our Picks, Coming Up and the wire beneath it — the four
 * block shape has to survive a curious tap.
 *
 * THE COUNT LINE STATES THE BASIS. A block governed by a filter says what it is
 * reading: "219 players / PGA Tour season".
 *
 * THE MARK CHANGES BY BOARD, THE ROW DOES NOT. Players carry the round player
 * mark; schools carry a SQUARE crest in the same grid. Figures are tabular and
 * right-aligned so the column reads down the page.
 *
 * TRUE MINUS on the live board: under par reads red, level and over par read
 * ink. NO AMBER on this block — no viewing member appears on a tour board.
 */

import { useNavigate } from 'react-router-dom';

import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RailChips } from '@/components/ui/RailChips';
import { DISCOVER_FACT, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { HAIRLINE_INK_7, INK, INK_MUTE, LIVE_INK } from '@/features/tourhub/_shared/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { BOARD_LABEL, type TourBoardRow, type TourBoardState } from './useTourBoardState';

/** Ten positions on the page; the rest arrive in place behind the see-all. */
const VISIBLE_POSITIONS = 10;

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

function scoreText(toPar: number | null): { text: string; tone: string } | null {
  if (toPar == null) return null;
  if (toPar === 0) return { text: 'E', tone: DISCOVER_FACT };
  /* TRUE MINUS (U+2212). */
  return {
    text: toPar > 0 ? `+${toPar}` : `\u2212${Math.abs(toPar)}`,
    tone: toPar < 0 ? TOPAR_RED : DISCOVER_FACT,
  };
}

/** The square school mark — the one geometric difference between the boards. */
function SchoolMark({ src, name }: { src: string | null; name: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 6,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${HAIRLINE_INK_7}`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ ...KICKER, fontSize: 11, color: INK_MUTE }}>{name.slice(0, 2)}</span>
      )}
    </div>
  );
}

export function BoardRow({ row, onPress }: { row: TourBoardRow; onPress: () => void }) {
  const score = scoreText(row.toPar);
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '11px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: `0.5px solid ${HAIRLINE_INK_7}`,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
        ...FIGS,
      }}
    >
      <span
        style={{
          width: 22,
          flex: '0 0 22px',
          fontSize: 12,
          fontWeight: 700,
          color: INK_MUTE,
        }}
      >
        {row.pos}
      </span>

      {row.mark === 'square' ? (
        <SchoolMark src={row.photoUrl} name={row.name} />
      ) : (
        <SquircleAvatar
          size={36}
          srcCandidates={resolvePlayerAvatarCandidates({
            name: row.name,
            photoUrl: row.photoUrl,
            tourSlug: row.tourCode ?? 'pga',
          })}
          alt={row.name}
          userId={row.id}
          hairlineRing
          className="[&>div]:!rounded-full"
        />
      )}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.name}
          </span>
          {row.country && <CountryFlag country={row.country} size="sm" />}
        </span>
        <span style={{ display: 'block', marginTop: 2, color: INK_MUTE, opacity: 0.62, fontSize: 11, lineHeight: 1.2 }}>
          {row.subline}
        </span>
      </span>

      <span
        style={{
          width: 62,
          flex: '0 0 62px',
          textAlign: 'right',
          fontSize: score ? 16 : 15,
          fontWeight: 700,
          color: score ? score.tone : INK,
        }}
      >
        {score ? score.text : row.figure ?? ''}
      </span>
    </button>
  );
}

export function TourLeaderboardBlock({ state }: { state: TourBoardState }) {
  const navigate = useNavigate();

  const { board, chips, rows, total, liveTournament } = state;
  const visible = rows.slice(0, VISIBLE_POSITIONS);

  const title = board === 'live' ? liveTournament?.name ?? BOARD_LABEL.live : BOARD_LABEL[board];
  const subject = board === 'colleges' ? 'schools' : 'players';
  const countLine = total > 0
    ? `${total} ${subject}${board === 'live' && liveTournament?.current_round ? ` · round ${liveTournament.current_round}` : board === 'live' ? '' : ' · season'}`.toUpperCase()
    : null;

  /* NO BOARD, NO SECTION. Champions out of tournament has nothing to rank, and
     an empty section shows nothing rather than a heading over no content. */
  if (state.silent || chips.length === 0) return null;

  const press = (row: TourBoardRow) => {
    analyticsEvents.track('tour_board_row_pressed', { board, pos: row.pos });
    if (row.mark === 'square') navigate(`/tourhub/college-golf/${row.id}`);
    else navigate(`/tourhub/player/${row.id}`);
  };

  return (
    <section style={{ paddingTop: 18, fontFamily: SANS, ...FIGS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 12 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 20, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.034em' }}>
          {title}
        </h2>
        {countLine && (
          <span style={{ ...KICKER, flexShrink: 0, color: INK_MUTE }}>
            {countLine}
          </span>
        )}
      </div>

      <RailChips
        options={chips.map((key) => ({ id: key, label: BOARD_LABEL[key] }))}
        value={board}
        onChange={(next) => {
          analyticsEvents.track('tour_board_changed', { board: next });
          state.changeBoard(next as typeof board);
        }}
        ariaLabel="Board"
        style={{ margin: '0 -20px 14px', padding: '0 20px' }}
      />

      {state.isPending ? (
        /* A HELD HEIGHT, not a spinner: the blocks below must not jump. */
        <div style={{ height: 300 }} aria-hidden />
      ) : state.unavailable ? (
        /* NOTHING IS INVENTED: an unsynced board says so and states nothing else. */
        <p style={{ margin: 0, padding: '16px 0', fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>
          This board is not available yet.
        </p>
      ) : (
        <>
          {visible.map((row) => (
            <BoardRow key={`${board}:${row.id}:${row.pos}`} row={row} onPress={() => press(row)} />
          ))}
          {rows.length > VISIBLE_POSITIONS && (
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('tour_board_see_all', { board, total });
                /* THE PUSHED PAGE, not a reveal: 219 rows in place would cost the
                   member the three blocks below. */
                navigate(`/tourhub/rankings?board=${board}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 14,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: INK_MUTE,
                fontFamily: SANS,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.11em',
              }}
            >
              <span>{board === 'live' ? 'FULL LEADERBOARD' : board === 'colleges' ? `ALL ${total} SCHOOLS` : 'FULL RANKINGS'}</span>
              <span style={{ color: INK_MUTE, opacity: 0.62 }}>›</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}
