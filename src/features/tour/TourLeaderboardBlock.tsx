/**
 * BLOCK 1 — THE RANKED LEADERBOARD (BRIEF_TOUR_REBUILD).
 *
 * ONE RANKED LIST, five boards behind chips (four out of tournament — the live
 * Leaderboard chip is ABSENT, not greyed, when nothing is in progress).
 *
 * CAPPED WITH A SEE-ALL. Ten positions on the page, the rest revealed in place:
 * a page of four blocks cannot spend two screens on one of them, and revealing
 * in place avoids a nested scroll.
 *
 * THE MARK CHANGES BY BOARD, THE ROW DOES NOT. Players carry the round player
 * mark; schools carry a SQUARE crest in the same grid. Figures are tabular and
 * right-aligned so the column reads down the page.
 *
 * TRUE MINUS on the live board: under par reads red, level and over par read
 * ink. NO AMBER on this block — no viewing member appears on a tour board.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { RailChips } from '@/components/ui/RailChips';
import { DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
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
        width: 34,
        height: 34,
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

function BoardRow({ row, onPress }: { row: TourBoardRow; onPress: () => void }) {
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
          width: 26,
          flex: '0 0 26px',
          textAlign: 'right',
          fontSize: 15,
          fontWeight: 200,
          color: INK,
        }}
      >
        {row.pos}
      </span>

      {row.mark === 'square' ? (
        <SchoolMark src={row.photoUrl} name={row.name} />
      ) : (
        <SquircleAvatar
          size={34}
          srcCandidates={resolvePlayerAvatarCandidates({
            name: row.name,
            photoUrl: row.photoUrl,
            tourSlug: row.tourCode ?? 'pga',
          })}
          alt={row.name}
          userId={row.id}
          hairlineRing
        />
      )}

      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.name}
        </span>
        {row.country && <CountryFlag country={row.country} size="sm" />}
      </span>

      {row.thru != null && (
        <span style={{ ...KICKER, color: row.thru >= 18 ? INK_MUTE : LIVE_INK }}>
          {row.thru >= 18 ? 'F' : `THRU ${row.thru}`}
        </span>
      )}

      <span
        style={{
          width: 62,
          flex: '0 0 62px',
          textAlign: 'right',
          fontSize: 14,
          fontWeight: 200,
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
  const [expanded, setExpanded] = useState(false);

  const { board, chips, rows, total, figureLabel, liveTournament } = state;
  const visible = expanded ? rows : rows.slice(0, VISIBLE_POSITIONS);

  const title = board === 'live' ? liveTournament?.name ?? BOARD_LABEL.live : BOARD_LABEL[board];
  const countLine = total > 0
    ? board === 'colleges'
      ? `${total} schools`
      : `${total} players`
    : null;

  const press = (row: TourBoardRow) => {
    analyticsEvents.track('tour_board_row_pressed', { board, pos: row.pos });
    if (row.mark === 'square') navigate(`/tourhub/college-golf/${row.id}`);
    else navigate(`/tourhub/player/${row.id}`);
  };

  return (
    <section style={{ paddingTop: 18, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading title={title} right={countLine ?? undefined} />

      <RailChips
        options={chips.map((key) => ({ id: key, label: BOARD_LABEL[key] }))}
        value={board}
        onChange={(next) => {
          analyticsEvents.track('tour_board_changed', { board: next });
          state.changeBoard(next as typeof board);
        }}
        ariaLabel="Board"
        style={{ margin: '0 -14px 12px', padding: '0 14px' }}
      />

      {figureLabel && rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            ...KICKER,
            color: DISCOVER_QUIET,
            paddingBottom: 6,
          }}
        >
          {figureLabel}
        </div>
      )}

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
          {rows.length > VISIBLE_POSITIONS && !expanded && (
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('tour_board_see_all', { board, total });
                setExpanded(true);
              }}
              style={{
                ...KICKER,
                display: 'block',
                width: '100%',
                marginTop: 12,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: INK,
                fontFamily: SANS,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              See all {total}
            </button>
          )}
        </>
      )}
    </section>
  );
}
