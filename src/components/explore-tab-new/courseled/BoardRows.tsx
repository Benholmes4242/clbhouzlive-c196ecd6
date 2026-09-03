import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { A, SANS } from './tokens';
import { relativeDayCompact } from './discoverWhen';
import { boardCountsRounds, isFeatBoard, type BoardKey } from './boardFilters';
import type { BoardRow as Row } from './hooks/useBoardPage';

/**
 * THE BOARD'S ROW (BRIEF_DISCOVER_FILTER_LED_BOARD S4/S5), shared by the board
 * and by the see-all sheet so the two can never draw the same round differently.
 *
 * S4.4 — EVERY BOARD STATES ITS UNIT IN A COLUMN HEADER. A bare "71" is not a
 * board. The unit comes from the board key and nothing else.
 *
 * S5.4 — THE MEMBER'S OWN ROW IS AMBER wherever it lands, and the pinned copy
 * of it carries the GAP in the board's own unit. Amber on this surface means YOU
 * and is not spent on anything else.
 */

const TOPAR_UNDER = '#E5484D';

export interface BoardColumns {
  value: { i18n: string; label: string };
  secondary: { i18n: string; label: string } | null;
}

export function boardColumns(board: BoardKey): BoardColumns {
  switch (board) {
    case 'gross':
      return {
        value: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        secondary: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
      };
    case 'topar':
      return {
        value: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
      };
    case 'net':
      return {
        value: { i18n: 'discover.filterBoard.col.net', label: 'NET' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
      };
    case 'stableford':
      return {
        value: { i18n: 'discover.filterBoard.col.points', label: 'PTS' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
      };
    case 'improved':
      return {
        value: { i18n: 'discover.filterBoard.col.cut', label: 'CUT' },
        secondary: null,
      };
    case 'birdies':
      return {
        value: { i18n: 'discover.filterBoard.col.birdies', label: 'BIRDIES' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
      };
    /* A3.1 — MOST RECENT CARRIES TO PAR, NOT GROSS. The board spans many
       courses, so a bare 71 beside an 85 is two unrelated numbers; to-par is
       the figure that travels between courses. */
    case 'recent':
      return {
        value: { i18n: 'discover.filterBoard.col.when', label: 'WHEN' },
        secondary: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
      };
    /* B1.3 / A3.5 — THE FEAT BOARDS KEEP GROSS: they are event lists where the
       interesting fact is the feat and gross is context, not comparison. */
    default:
      return {
        value: { i18n: 'discover.filterBoard.col.when', label: 'WHEN' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
      };
  }
}

/** True minus, never a hyphen; E at level. */
export function fmtToPar(n: number | null): string {
  if (n == null) return '\u2014';
  const r = Math.round(n);
  return r === 0 ? 'E' : r < 0 ? `\u2212${Math.abs(r)}` : `+${r}`;
}

function toParOf(r: Row): number | null {
  if (r.gross_score == null || r.course_par == null) return null;
  return r.gross_score - r.course_par;
}

/** One decimal, true minus — the index-movement figure grammar. */
function fmtCut(n: number | null): string {
  if (n == null) return '\u2014';
  const v = Math.abs(n);
  return v.toFixed(1);
}

interface Cell {
  text: string;
  tone: string;
}

export function boardValue(
  r: Row,
  board: BoardKey,
  t: (k: string, d?: string) => string,
): Cell {
  switch (board) {
    case 'gross':
      return { text: r.gross_score != null ? String(r.gross_score) : '\u2014', tone: A.INK };
    case 'topar': {
      const p = toParOf(r);
      return { text: fmtToPar(p), tone: p != null && p < 0 ? TOPAR_UNDER : A.INK };
    }
    case 'net':
      return { text: r.net_score != null ? String(Math.round(r.net_score)) : '\u2014', tone: A.INK };
    case 'stableford':
      return {
        text: r.stableford_points != null ? String(r.stableford_points) : '\u2014',
        tone: A.INK,
      };
    case 'improved':
      return { text: fmtCut(r.delta_index), tone: A.INK };
    case 'birdies':
      return { text: r.birdies != null ? String(r.birdies) : '\u2014', tone: A.INK };
    case 'recent':
    default:
      /* Feat boards land here too: their value IS the date (B1.3), now on the
         relative-day ladder so a 2024 ace never reads as a weekday (A2.2). */
      return { text: relativeDayCompact(r.play_date, t as never), tone: A.INK };
  }
}

export function boardSecondary(r: Row, board: BoardKey): Cell | null {
  switch (board) {
    case 'gross': {
      const p = toParOf(r);
      return { text: fmtToPar(p), tone: p != null && p < 0 ? TOPAR_UNDER : A.MUTE };
    }
    case 'improved':
      return null;
    /* A3.1/A3.3/A3.4 — TO PAR under the standard colour law; a round with no
       usable par states an em-dash in A.DIM, never a zero and never a blank. */
    case 'recent': {
      const p = toParOf(r);
      return {
        text: fmtToPar(p),
        tone: p == null ? A.DIM : p < 0 ? TOPAR_UNDER : p === 0 ? A.MUTE : A.INK,
      };
    }
    case 'topar':
    case 'net':
    case 'stableford':
    case 'birdies':
    default:
      return {
        text: r.gross_score != null ? String(r.gross_score) : '\u2014',
        tone: A.MUTE,
      };
  }
}

/**
 * S5.4 — THE GAP, IN THE BOARD'S UNIT. `sort_value` is the RPC's own ranking
 * quantity, so the difference between two rows is the gap on every board without
 * a per-board formula here. 'recent' has no gap worth stating in strokes: the
 * distance is a number of ROUNDS, so it uses the positions instead.
 */
export function gapText(
  board: BoardKey,
  mine: Row,
  leader: Row,
  t: (k: string, d?: string, o?: object) => string,
): string | null {
  if (mine.pos <= 1) return null;
  if (boardCountsRounds(board)) {
    return t('discover.filterBoard.gapRounds', '{{count}} rounds back', {
      count: mine.pos - leader.pos,
    });
  }
  if (mine.sort_value == null || leader.sort_value == null) return null;
  const d = Math.abs(Number(mine.sort_value) - Number(leader.sort_value));
  if (!Number.isFinite(d) || d === 0) return null;
  switch (board) {
    case 'stableford':
      return t('discover.filterBoard.gapPoints', '{{n}} points back', { n: Math.round(d) });
    case 'birdies':
      return t('discover.filterBoard.gapBirdies', '{{n}} birdies back', { n: Math.round(d) });
    case 'improved':
      return t('discover.filterBoard.gapCut', '{{n}} off the lead', { n: d.toFixed(1) });
    default:
      return t('discover.filterBoard.gapShots', '{{n}} shots back', { n: Math.round(d) });
  }
}

/**
 * THE BOARD'S AVATAR (A1). A member with a photo renders the photo, unchanged,
 * through the canonical SquircleAvatar. Only the FALLBACK differs: the shared
 * AVATAR_FALLBACK_PALETTE is twelve near-identical desaturated slates, which on
 * this dark canvas read as one block of grey, so the fallback here takes a
 * HUE-ONLY fill derived from the stable user id (A1.2). Fixed saturation and
 * lightness keep every tile at the same visual weight. AN AVATAR IS NEVER
 * AMBER, including the member's own.
 */
/* S4 — THE FORK IS FOLDED BACK. The board no longer builds its own fallback
   tile: SquircleAvatar now carries the same hue, so the photo row and the
   fallback row finally share one geometry. */
export function BoardAvatar({ row, size = 28 }: { row: Row; size?: number }) {
  const { t } = useTranslation('courses');
  return (
    <SquircleAvatar
      src={row.profile_photo_url ?? null}
      alt={row.display_name ?? t('discover.aMember', 'A member')}
      userId={row.user_id}
      fallback={getInitialsFromName(row.display_name).slice(0, 2)}
      size={size}
      hairlineRing
    />
  );
}

const POS_W = 28;
const VALUE_W = 58;
const SECOND_W = 46;

export function BoardHeaderRow({ board }: { board: BoardKey }) {
  const { t } = useTranslation('courses');
  const cols = boardColumns(board);
  const cap: React.CSSProperties = {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    color: A.DIM,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 2px 6px',
        borderBottom: `1px solid ${A.BORDER}`,
      }}
    >
      <span style={{ ...cap, width: POS_W, textAlign: 'center', flexShrink: 0 }}>
        {t('discover.filterBoard.col.pos', 'POS')}
      </span>
      <span style={{ ...cap, flex: 1, minWidth: 0 }}>
        {t('discover.filterBoard.col.member', 'MEMBER')}
      </span>
      {cols.secondary && (
        <span style={{ ...cap, width: SECOND_W, textAlign: 'center', flexShrink: 0 }}>
          {t(cols.secondary.i18n, cols.secondary.label)}
        </span>
      )}
      <span style={{ ...cap, width: VALUE_W, textAlign: 'center', flexShrink: 0 }}>
        {t(cols.value.i18n, cols.value.label)}
      </span>
    </div>
  );

}

export function BoardRowView({
  row,
  board,
  isSelf,
  gap,
  onPress,
}: {
  row: Row;
  board: BoardKey;
  isSelf: boolean;
  /** Only the PINNED copy of the member's row carries this (S5.4). */
  gap?: string | null;
  onPress?: (row: Row) => void;
}) {
  const { t } = useTranslation('courses');
  const value = boardValue(row, board, t as never);
  const second = boardSecondary(row, board);
  const ink = isSelf ? A.AMBER : A.INK;
  const feat =
    (row.holes_in_one ?? 0) > 0
      ? t('discover.filterBoard.featAce', 'HOLE IN ONE')
      : (row.albatrosses ?? 0) > 0
        ? t('discover.filterBoard.featAlbatross', 'ALBATROSS')
        : null;

  return (
    <button
      type="button"
      onClick={() => onPress?.(row)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 2px',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <span
          className="tabular-nums"
          style={{
            width: POS_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: isSelf ? A.AMBER : A.MUTE,
          }}
        >
          {/* A TIE STATES ITSELF: T4, never a silent second 4. On a feat board
              is_tie is always false, so this renders a plain number (B1.3). */}
          {row.is_tie ? `T${row.pos}` : row.pos}
        </span>

      <span style={{ flexShrink: 0 }}>
        <BoardAvatar row={row} size={28} />
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          height: 28,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 700,
            color: ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
          }}
        >
          {row.display_name ?? t('discover.aMember', 'A member')}
        </span>
        {/* S5.5 — THE SECOND LINE IS THE COURSE, on every board and every row. */}
        <span
          style={{
            display: 'block',
            marginTop: 1,
            fontSize: 11.5,
            fontWeight: 600,
            color: A.MUTE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '12px',
          }}
        >
          {gap ??
            (feat
              ? `${row.course_name ?? t('discover.unknownCourse', 'A course')} \u00B7 ${feat}`
              : (row.course_name ?? t('discover.unknownCourse', 'A course')))}
        </span>
      </span>
      {second && (
        <span
          className="tabular-nums"
          style={{
            width: SECOND_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 12.5,
            fontWeight: 700,
            color: second.tone,
          }}
        >
          {second.text}
        </span>
      )}
      <span
        className="tabular-nums"
        style={{
          width: VALUE_W,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: isSelf ? A.AMBER : value.tone,
          textTransform: 'uppercase',
        }}
      >
        {value.text}
      </span>
    </button>
  );
}
