import { ROW_METRICS } from './rowMetrics';
import { MemberAvatar } from './MemberAvatar';
import { useTranslation } from 'react-i18next';

import { A, SANS, SELF_ROW_TINT, INDEX_CUT_BORDER } from './tokens';
import { playDateShort } from './discoverWhen';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { boardCountsRounds, isFeatBoard, type BoardKey, type FeatBoardKey } from './boardFilters';
import type { ExploreRoundFeatKind } from '@/features/explore-magazine/roundFeatCollection';
import type { BoardRow as Row } from './hooks/useBoardPage';
import { collectRoundFeats, FEAT_PRECEDENCE, topRoundFeats, type ExploreRoundFeat } from '@/features/explore-magazine/roundFeatCollection';
import type { TFunction } from 'i18next';

/**
 * THE BOARD'S ROW (BRIEF_DISCOVER_FILTER_LED_BOARD S4/S5), shared by the board
 * and by the see-all sheet so the two can never draw the same round differently.
 *
 * S4.4 — EVERY BOARD STATES ITS UNIT. A bare "71" is not a board. On the lead
 * board the unit is stated in PROSE by the basis sentence (Phase 9.9 deleted its
 * column header; 9.3 makes the rounds sentence name both to-par figures). The
 * see-all sheet still states it in BoardHeaderRow. The unit comes from the board
 * key and nothing else.
 *
 * S5.4 — THE MEMBER'S OWN ROW IS AMBER wherever it lands, and the pinned copy
 * of it carries the GAP in the board's own unit. Amber on this surface means YOU
 * and is not spent on anything else.
 */

/** The faintest analytical ink; no separate FAINT token exists. */
const FAINT = A.DIM;

/* TO-PAR RED HAS EXACTLY ONE SOURCE: TOPAR_UNDER_DARK, read here as A.RED. A local hex for it is always a fork. */

export interface BoardColumns {
  value: { i18n: string; label: string };
  secondary: { i18n: string; label: string } | null;
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
        ranked: true,
      };
    case 'topar':
      return {
        value: { i18n: 'discover.filterBoard.col.toPar', label: 'TO PAR' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        ranked: true,
      };
    case 'net':
      return {
        value: { i18n: 'discover.filterBoard.col.net', label: 'NET' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        ranked: true,
      };
    case 'stableford':
      return {
        value: { i18n: 'discover.filterBoard.col.points', label: 'PTS' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        ranked: true,
      };
    case 'improved':
      return {
        value: { i18n: 'discover.filterBoard.col.cut', label: 'CUT' },
        secondary: null,
        ranked: true,
      };
    case 'birdies':
      return {
        value: { i18n: 'discover.filterBoard.col.birdies', label: 'BIRDIES' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        ranked: true,
      };
    /* A3.1 — MOST RECENT CARRIES TO PAR, NOT GROSS. The board spans many
       courses, so a bare 71 beside an 85 is two unrelated numbers; to-par is
       the figure that travels between courses. */
    /* Phase 9.10 — NET against par leads, GROSS against par behind. */
    case 'recent':
      return {
        value: { i18n: 'discover.filterBoard.col.net', label: 'NET' },
        secondary: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        ranked: false,
      };
    /* B1.3 / A3.5 — THE FEAT BOARDS KEEP GROSS: they are event lists where the
       interesting fact is the feat and gross is context, not comparison. */
    default:
      return {
        value: { i18n: 'discover.filterBoard.col.gross', label: 'GROSS' },
        secondary: null,
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
    /* Phase 9.10 — NET against par, red under par; with no net, GROSS against
       par takes the main figure and there is no secondary. */
    case 'recent': {
      const n = netToParOf(r) ?? toParOf(r);
      return { text: fmtToPar(n), tone: n != null && n < 0 ? A.RED : A.INK };
    }
    /* Feat boards: gross, plain, no tone. The date lives on the sub-line and in
       the day ladder, so it is no longer a figure. */
    default:
      return { text: r.gross_score != null ? String(r.gross_score) : '\u2014', tone: A.INK };
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
    /* Gross against par behind net; nothing when net is absent (it moved up). */
    case 'recent':
      return netToParOf(r) == null ? null : { text: fmtToPar(toParOf(r)), tone: FAINT };
    case 'topar':
    case 'net':
    case 'stableford':
    case 'birdies':
      return {
        text: r.gross_score != null ? String(r.gross_score) : '\u2014',
        tone: FAINT,
      };
    /* Feat boards: no secondary (9.10). */
    default:
      return null;
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

const M = ROW_METRICS;
/** 9.7 — two grammars, chosen by boardColumns(board).ranked. */
function gridFor(ranked: boolean): string {
  return ranked
    ? `${M.posTrack}px ${M.avatar}px minmax(0,1fr) auto`
    : `${M.avatar}px minmax(0,1fr) auto`;
}

/** The sheet's column labels. The lead board has none (9.9). */
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
        display: 'grid',
        gridTemplateColumns: gridFor(cols.ranked),
        columnGap: M.colGap,
        alignItems: 'center',
        padding: `0 ${M.padX}px 6px`,
        /* Hairline clause: labels from data. */
        borderBottom: `1px solid ${A.BORDER}`,
      }}
    >
      {cols.ranked && <span style={{ ...cap, textAlign: 'center' }}>{t('discover.filterBoard.col.pos')}</span>}
      <span style={{ ...cap, gridColumn: 'span 2' }}>{t('discover.filterBoard.col.member')}</span>
      <span style={{ ...cap, textAlign: 'right' }}>
        {t(cols.value.i18n)}
        {cols.secondary ? <> {'\u00B7'} {t(cols.secondary.i18n)}</> : null}
      </span>
    </div>
  );
}

/** 9.8 — the day-ladder separator, feed grammar only. */
export function BoardDaySeparator({ label }: { label: string }) {
  return (
    <div
      data-board-day
      style={{
        padding: `12px ${M.padX}px 7px`,
        fontFamily: SANS,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      {label}
    </div>
  );
}

/** 9.11 — one decimal, true minus, always signed. */
function fmtIndexChip(n: number): string {
  const v = Math.abs(n).toFixed(1);
  return n < 0 ? `\u2212${v}` : `+${v}`;
}

export function BoardRowView({
  row,
  board,
  isSelf,
  gap,
  pinned,
  onPress,
}: {
  row: Row;
  board: BoardKey;
  isSelf: boolean;
  /** Only the PINNED copy of the member's row carries this (S5.4). */
  gap?: string | null;
  /** The pinned self row: a 12px break above it (9.13). */
  pinned?: boolean;
  onPress?: (row: Row) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const value = boardValue(row, board, t as never);
  const second = boardSecondary(row, board);
  const { ranked } = boardColumns(board);
  const feat = boardFeatMarker(row, board, t);
  const course = row.course_name ?? t('discover.unknownCourse');
  const date = playDateShort(row.play_date, i18n?.language);
  const courseDate = date ? `${course} \u00B7 ${date}` : course;
  /* The feat stays where it was: leading the second line on a feat board. */
  const sub = gap ?? (feat && isFeatBoard(board) ? `${feat} \u00B7 ${courseDate}` : courseDate);
  const chip = !ranked && row.delta_index != null && Number(row.delta_index) !== 0 ? Number(row.delta_index) : null;

  return (
    <button
      type="button"
      onClick={() => onPress?.(row)}
      data-board-self={isSelf ? '' : undefined}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: gridFor(ranked),
        columnGap: M.colGap,
        alignItems: 'center',
        padding: `${M.padY}px ${M.padX}px`,
        marginTop: pinned ? M.pinnedGap : 0,
        background: isSelf ? SELF_ROW_TINT : 'transparent',
        border: 'none',
        /* 9.13 — every row carries a hairline beneath it, the last included. */
        borderBottom: `1px solid ${A.SOFT}`,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      {ranked && (
        <span
          className="tabular-nums"
          style={{
            textAlign: 'center',
            fontSize: M.posSize,
            fontWeight: M.posWeight,
            /* 9.12 — first place is gold; the member's own position stays amber. */
            color: row.pos === 1 ? MEDAL_GOLD : isSelf ? A.AMBER : A.MUTE,
          }}
        >
          {/* A TIE STATES ITSELF: T4, never a silent second 4. */}
          {row.is_tie ? `T${row.pos}` : row.pos}
        </span>
      )}
      <span style={{ display: 'flex' }}>
        <MemberAvatar userId={row.user_id} name={row.display_name} photoUrl={row.profile_photo_url} size={M.avatar} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: M.nameSize,
            fontWeight: M.nameWeight,
            letterSpacing: '-0.01em',
            lineHeight: M.nameLine,
            color: isSelf ? A.AMBER : A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.display_name ?? t('discover.aMember')}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 1,
            fontSize: M.subSize,
            lineHeight: M.subLine,
            color: A.MUTE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8 }}>
        {chip != null ? (
          <span
            data-index-chip
            className="tabular-nums"
            style={{
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 999,
              padding: '1px 5px',
              color: chip < 0 ? A.GREEN : A.MUTE,
              border: `1px solid ${chip < 0 ? INDEX_CUT_BORDER : A.BORDER}`,
            }}
          >
            {fmtIndexChip(chip)}
          </span>
        ) : null}
        {/* S1.3 — THE FIGURE FOLLOWS THE COLOUR LAW, NEVER AMBER. */}
        <span
          data-board-main
          className="tabular-nums"
          style={{ fontSize: M.figureSize, fontWeight: M.figureWeight, letterSpacing: '-0.02em', color: value.tone }}
        >
          {value.text}
        </span>
        {second ? (
          <span
            data-board-secondary
            className="tabular-nums"
            style={{ fontSize: M.secondarySize, fontWeight: M.secondaryWeight, color: second.tone }}
          >
            {second.text}
          </span>
        ) : null}
      </span>
    </button>
  );
}
