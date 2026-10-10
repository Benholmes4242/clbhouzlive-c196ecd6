import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { A, SANS } from './tokens';
import { relativeDayCompact } from './discoverWhen';
import { boardCountsRounds, isFeatBoard, type BoardKey, type FeatBoardKey } from './boardFilters';
import type { ExploreRoundFeatKind } from '@/features/explore-magazine/roundFeatCollection';
import type { BoardRow as Row } from './hooks/useBoardPage';
import { INK_TINT_04 as LEADER_WASH } from '@/features/tourhub/_shared/tokens';
import { collectRoundFeats, FEAT_PRECEDENCE, topRoundFeats, type ExploreRoundFeat } from '@/features/explore-magazine/roundFeatCollection';
import type { TFunction } from 'i18next';

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

/* TO-PAR RED HAS EXACTLY ONE SOURCE: TOPAR_UNDER_DARK, read here as A.RED. A local hex for it is always a fork. */

export interface BoardColumns {
  value: { i18n: string; label: string };
  secondary: { i18n: string; label: string } | null;
  /**
   * B4.3 — TRUE WHEN THE VALUE CELL HOLDS WORDS RATHER THAN A FIGURE. Only the
   * five WHEN boards ('recent' and the four feats). Four to six uppercase
   * letters carry far more mass than a two-digit figure at the same size, so
   * the row renders a textual value at 12.5 instead of 15. boardColumns() is
   * the one place that knows what each column holds; the row never re-derives
   * it from a board-key list.
   */
  valueIsText: boolean;
  /** FALSE ON THE FIVE WHEN BOARDS. They are ordered by date, so a position
      column would number recency and call it rank — and because the sheet groups
      by month, the count runs ACROSS the groups: 1-6 in September, 7 in August.
      Everyone on a feat board did the thing; there is nothing to come first in. */
  ranked: boolean;
}

export function boardColumns(board: BoardKey): BoardColumns {
  switch (board) {
    case 'gross':
      return {
        value: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        secondary: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
        valueIsText: false,
        ranked: true,
      };
    case 'topar':
      return {
        value: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        valueIsText: false,
        ranked: true,
      };
    case 'net':
      return {
        value: { i18n: 'discover.filterBoard.col.net', label: 'NET' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        valueIsText: false,
        ranked: true,
      };
    case 'stableford':
      return {
        value: { i18n: 'discover.filterBoard.col.points', label: 'PTS' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        valueIsText: false,
        ranked: true,
      };
    case 'improved':
      return {
        value: { i18n: 'discover.filterBoard.col.cut', label: 'CUT' },
        secondary: null,
        valueIsText: false,
        ranked: true,
      };
    case 'birdies':
      return {
        value: { i18n: 'discover.filterBoard.col.birdies', label: 'BIRDIES' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        valueIsText: false,
        ranked: true,
      };
    /* A3.1 — MOST RECENT CARRIES TO PAR, NOT GROSS. The board spans many
       courses, so a bare 71 beside an 85 is two unrelated numbers; to-par is
       the figure that travels between courses. */
    case 'recent':
      return {
        value: { i18n: 'discover.filterBoard.col.when', label: 'WHEN' },
        secondary: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
        valueIsText: true,
        ranked: false,
      };
    /* B1.3 / A3.5 — THE FEAT BOARDS KEEP GROSS: they are event lists where the
       interesting fact is the feat and gross is context, not comparison. */
    default:
      return {
        value: { i18n: 'discover.filterBoard.col.when', label: 'WHEN' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        valueIsText: true,
        ranked: false,
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

/** B2.1 — the net board's RANKED quantity: net against the course's par. */
function netToParOf(r: Row): number | null {
  if (r.net_score == null || r.course_par == null) return null;
  return r.net_score - r.course_par;
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
      return { text: fmtToPar(p), tone: p != null && p < 0 ? A.RED : A.INK };
    }
    /* AMENDMENT B2.1/B2.2 — THE NET BOARD RENDERS ITS RANKED FIGURE. The RPC
       ranks 'net' on (net_score - course_par), so the column must show net TO
       PAR or the board sorts on one number and displays another. The label
       stays NET: "nett five under" is how a comp leaderboard reads. B2.4 — the
       under-par colour law applies, true minus and never a hyphen. */
    case 'net': {
      const n = netToParOf(r);
      return { text: fmtToPar(n), tone: n != null && n < 0 ? A.RED : A.INK };
    }
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
      return { text: fmtToPar(p), tone: p != null && p < 0 ? A.RED : A.MUTE };
    }
    case 'improved':
      return null;
    /* A3.1/A3.3/A3.4 — TO PAR under the standard colour law; a round with no
       usable par states an em-dash in A.DIM, never a zero and never a blank. */
    case 'recent': {
      const p = toParOf(r);
      return {
        text: fmtToPar(p),
        tone: p == null ? A.DIM : p < 0 ? A.RED : p === 0 ? A.MUTE : A.INK,
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
/* RETAINED WITHOUT A CALLER (Leaderboards Phase 3.2): its last caller,
   AmateurLeaderboardBlock, is gone. Kept because it states the distance between
   two rows in the board's own unit — what the standing row will need to say how
   far behind the member is. Do not delete as dead code. */
export function gapText(
  board: BoardKey,
  mine: Row,
  leader: Row,
  t: (k: string, o?: object) => string,
): string | null {
  if (mine.pos <= 1) return null;
  if (boardCountsRounds(board)) {
    return t('discover.filterBoard.gapRounds', {
      count: mine.pos - leader.pos,
    });
  }
  if (mine.sort_value == null || leader.sort_value == null) return null;
  const d = Math.abs(Number(mine.sort_value) - Number(leader.sort_value));
  if (!Number.isFinite(d) || d === 0) return null;
  switch (board) {
    case 'stableford':
      return t('discover.filterBoard.gapPoints', { n: Math.round(d) });
    case 'birdies':
      return t('discover.filterBoard.gapBirdies', { n: Math.round(d) });
    case 'improved':
      return t('discover.filterBoard.gapCut', { n: d.toFixed(1) });
    default:
      return t('discover.filterBoard.gapShots', { n: Math.round(d) });
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
      alt={row.display_name ?? t('discover.aMember')}
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
/** Podium avatar and figure — the first row's emphasis on a ranked board. */
const PODIUM_AVATAR = 46;
export const PODIUM_FIGURE_SIZE = 30;

type BoardT = TFunction<'courses'>;

function boardFeatLabel(feat: ExploreRoundFeat, t: BoardT): string {
  switch (feat.kind) {
    case 'ace':
      return t('discover.filterBoard.featAce', { count: feat.count });
    case 'albatross':
      return t('discover.filterBoard.featAlbatross', { count: feat.count });
    case 'eagle':
      return t('discover.filterBoard.featEagle', { count: feat.count });
    case 'birdies':
      return t('discover.filterBoard.featBirdies', { count: feat.count });
    case 'clean':
      return t('discover.filterBoard.featClean');
  }
}

/** The feat each feat sheet is ABOUT. A marker that only restates this (count
 *  1 or absent) repeats the sheet header and is dropped; a count the header
 *  cannot carry ("2 EAGLES") and a feat of another kind survive. */
const FEAT_BOARD_SUBJECT: Record<FeatBoardKey, ExploreRoundFeatKind> = {
  ace: 'ace',
  albatross: 'albatross',
  eagle: 'eagle',
  clean_card: 'clean',
};

export function boardFeatMarker(row: Row, board: BoardKey, t: BoardT): string | null {
  const subject = isFeatBoard(board) ? FEAT_BOARD_SUBJECT[board as FeatBoardKey] : null;
  /* FEAT SHEET: a round shows only what OUTRANKS the sheet's feat — its own
     brace ("2 EAGLES"), a strictly rarer feat, or bogey-free. A lesser feat
     (an eagle on the holes-in-one sheet, maybe the very same shot) is dropped.
     Ranking boards filter nothing. Filter before the two-item cap. */
  const feats = subject
    ? collectRoundFeats(row)
        .filter(
          (feat) =>
            (feat.kind === subject && feat.kind !== 'clean' && feat.count > 1)
            || FEAT_PRECEDENCE[feat.kind] < FEAT_PRECEDENCE[subject]
            || (feat.kind === 'clean' && subject !== 'clean'),
        )
        .slice(0, 2)
    : topRoundFeats(row);
  const labels = feats.map((feat) => boardFeatLabel(feat, t));
  if (labels.length === 0) return null;
  return labels.length > 1
    ? t('discover.filterBoard.featJoin', { first: labels[0], second: labels[1] })
    : labels[0];
}

export function BoardHeaderRow({ board, hideValue }: { board: BoardKey; hideValue?: boolean }) {
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
      {cols.ranked && (
        <span style={{ ...cap, width: POS_W, textAlign: 'center', flexShrink: 0 }}>
          {t('discover.filterBoard.col.pos')}
        </span>
      )}
      <span style={{ ...cap, flex: 1, minWidth: 0 }}>
        {t('discover.filterBoard.col.member')}
      </span>
      {cols.secondary && (
        <span style={{ ...cap, width: SECOND_W, textAlign: 'center', flexShrink: 0 }}>
          {t(cols.secondary.i18n)}
        </span>
      )}
      {/* S4.3 — on a DAY-GROUPED sheet the WHEN value is stated once per group,
          so neither the column nor its header belongs on the row. */}
      {!hideValue && (
        <span style={{ ...cap, width: VALUE_W, textAlign: 'center', flexShrink: 0 }}>
          {t(cols.value.i18n)}
        </span>
      )}
    </div>
  );

}

export function BoardRowView({
  row,
  board,
  isSelf,
  gap,
  hideValue,
  podium,
  onPress,
}: {
  row: Row;
  board: BoardKey;
  isSelf: boolean;
  /** Only the PINNED copy of the member's row carries this (S5.4). */
  gap?: string | null;
  /** S4.3 — the day-grouped sheet states WHEN in its group header instead. */
  hideValue?: boolean;
  /** THE PODIUM IS A TREATMENT OF THE FIRST ROW, NOT A SECOND ROW COMPONENT.
   *  Same helpers, same figures, same colour law — only size and emphasis
   *  change. Ignored on an unranked board: on a date order a podium is a lie. */
  podium?: boolean;
  onPress?: (row: Row) => void;
}) {
  const { t } = useTranslation('courses');
  const value = boardValue(row, board, t as never);
  const second = boardSecondary(row, board);
  /* B4.3 — the column, not the row, decides whether the value is words. */
  const { valueIsText, ranked } = boardColumns(board);
  const ink = isSelf ? A.AMBER : A.INK;
  const feat = boardFeatMarker(row, board, t);
  const big = !!podium && ranked;
  const avatar = big ? PODIUM_AVATAR : 28;

  return (
    <button
      type="button"
      onClick={() => onPress?.(row)}
      data-board-podium={big ? '' : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: big ? '12px 2px' : '6px 2px',
        borderRadius: big ? 12 : undefined,
        /* The wash states rank; amber remains the viewing member's identity. */
        background: ranked && row.pos === 1 ? LEADER_WASH : 'transparent',
        border: 'none',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      {ranked && (
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
      )}

      <span style={{ flexShrink: 0 }}>
        <BoardAvatar row={row} size={avatar} />
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          height: avatar,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'block',
            /* §7 ROW NAME — 14 / 600. */
            fontSize: big ? 16 : 14,
            fontWeight: big ? 700 : 600,
            color: ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: big ? '18px' : '14px',
          }}
        >
          {row.display_name ?? t('discover.aMember')}
        </span>
        {/* S5.5 — THE SECOND LINE IS THE COURSE, on every board and every row. */}
        {!gap && feat && !ranked ? (
          /* On a feat board the feat is the subject: it leads and never
             shrinks; the course is context and truncates behind it. */
          <span
            style={{
              display: 'flex',
              marginTop: 1,
              fontSize: 11,
              fontWeight: 600,
              color: A.DIM,
              whiteSpace: 'nowrap',
              lineHeight: '12px',
              minWidth: 0,
            }}
          >
            <span style={{ flexShrink: 0 }}>{feat} {'\u00B7'}&nbsp;</span>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.course_name ?? t('discover.unknownCourse')}
            </span>
          </span>
        ) : (
          <span
            style={{
              display: 'block',
              marginTop: 1,
              /* §7 ROW SUB-LINE — 11 DIM. */
              fontSize: 11,
              fontWeight: 600,
              color: A.DIM,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '12px',
            }}
          >
            {gap ??
            (feat
              ? `${row.course_name ?? t('discover.unknownCourse')} \u00B7 ${feat}`
              : (row.course_name ?? t('discover.unknownCourse')))}
          </span>
        )}
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
            letterSpacing: '-0.04em',
            color: second.tone,
          }}
        >
          {second.text}
        </span>
      )}
      {!hideValue && (
        <span
          className="tabular-nums"
          style={{
            width: VALUE_W,
            flexShrink: 0,
            textAlign: 'center',
            /* B4.2 — WORDS at 12.5, FIGURES at 15. VALUE_W stays 58 either way
               (B4.5) so the right edge aligns across boards. */
            /* §7 ROW FIGURE — 16 tabular, -0.04em. Words stay at 12.5. */
            fontSize: valueIsText ? 12.5 : big ? PODIUM_FIGURE_SIZE : 16,
            fontWeight: 700,
            letterSpacing: valueIsText ? undefined : '-0.04em',
            /* S1.3 — THE RANKED FIGURE FOLLOWS THE COLOUR LAW, NEVER AMBER:
               under par red, over par ink, level muted, on the member's own row
               as on any other. Amber marks the position and the name only. */
            color: value.tone,
            textTransform: 'uppercase',
          }}
        >
          {value.text}
        </span>
      )}
    </button>
  );
}
