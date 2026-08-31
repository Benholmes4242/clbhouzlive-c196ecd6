/**
 * Shared parts for the Champions boards in the analytical treatment
 * (BRIEF_COURSE_CHAMPIONS_TAB_TREATMENT).
 *
 * ONE implementation of the row and the column header, used by both the
 * board panel and the full-leaderboard sheet, so the two cannot drift.
 *
 * Rules encoded here:
 *   - the member's row takes AMBER on the name and the value; there is no
 *     tinted row background anywhere
 *   - rank is a plain figure in every position, including 1st - no chip,
 *     no crown glyph substituting for the number
 *   - progress bars and their labels have been removed; a bar implies a scale,
 *     and these boards carry their meaning in the figures instead
 */
import React from 'react';
import { Crown } from 'lucide-react';
import { A, LABEL, NUM, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MovementCell } from './MovementCell';

/**
 * Grid: [rank+movement] | avatar | name | [gap+value].
 *
 * BRIEF_CHAMPIONS_TOGGLE_AND_BOARD §2.3 — each figure sits with what it
 * modifies. Rank MOVEMENT describes a change in position, so it shares the
 * rank cell; the STROKE GAP describes a difference in the value, so it shares
 * the value cell. No fifth or sixth column: there is no room at 390 without
 * shrinking the name.
 *
 * §2.2 — the movement track is computed ONCE per board (`anyMovement`) and
 * collapses to zero width when nothing moved, so names stay aligned across
 * every row in both states. Never branch per row.
 */
export const boardGrid = (withMovement: boolean) =>
  `${withMovement ? 46 : 22}px 26px 1fr 82px`;
/** Back-compat: the movement-expanded grid. */
export const BOARD_GRID = boardGrid(true);
export const BOARD_GAP = 10;

/** True when at least one row actually moved. A new entrant is not movement. */
export function hasAnyMovement(
  rows: ReadonlyArray<{ delta?: number | null }>,
): boolean {
  return rows.some((r) => r.delta != null && r.delta !== 0);
}

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";

/** 26px squircle with the canonical 1px traced hairline ring. */
export const BoardAvatar: React.FC<{ photoUrl: string | null; name: string; size?: number }> = ({
  photoUrl,
  name,
  size = 26,
}) => {
  const initials =
    (name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '';
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: photoUrl
            ? `url(${photoUrl}) center/cover`
            : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
          borderRadius: '34%',
          WebkitMaskImage: SQUIRCLE_MASK_URL,
          maskImage: SQUIRCLE_MASK_URL,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: SANS,
          fontSize: size <= 26 ? 9.5 : 11,
          fontWeight: 700,
        }}
      >
        {!photoUrl && initials}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34%',
          border: `1px solid rgba(255,255,255,0.14)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export interface BoardRowData {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  isSelf: boolean;
  rank30d?: number | null;
  delta?: number | null;
  /**
   * Signed gap from the leader in the member's terms, e.g. "+4" on lowest
   * gross, "-3" on a counting category. The LEADER passes null: zero is not a
   * fact here, it is the definition of being first.
   */
  gapDisplay?: string | null;
}

export const BoardRow: React.FC<{
  row: BoardRowData;
  rowRef?: React.Ref<HTMLDivElement>;
  /** Hairline above the row. Callers pass false for the first row of a board. */
  rule?: boolean;
  /** Board-level movement state. Computed once by the caller, never per row. */
  showMovement?: boolean;
}> = ({ row, rowRef, rule = true, showMovement = true }) => {
  const tone = row.isSelf ? A.AMBER : A.INK;
  return (
    <div
      ref={rowRef}
      style={{
        display: 'grid',
        gridTemplateColumns: boardGrid(showMovement),
        gap: BOARD_GAP,
        alignItems: 'center',
        padding: '9px 0',
        fontFamily: SANS,
        borderTop: rule ? `1px solid ${A.HAIRLINE}` : undefined,
      }}
    >
      <span
        style={{
          display: 'grid',
          gridTemplateColumns: showMovement ? '22px 4px 20px' : '22px',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        {showMovement && (
          <MovementCell delta={row.delta} rank30d={row.rank30d} theme="dark" size="figure" />
        )}
        {showMovement && <span aria-hidden />}
        <span style={{ ...NUM, fontSize: 12.5, color: A.DIM, textAlign: 'center' }}>{row.rank}</span>
      </span>
      <BoardAvatar photoUrl={row.photoUrl} name={row.name} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: tone,
          letterSpacing: '-0.01em',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {row.name}
      </span>
      <span
        style={{
          display: 'grid',
          gridTemplateColumns: row.gapDisplay ? '32px 4px 46px' : '0px 4px 46px',
          alignItems: 'center',
          justifyItems: 'center',
          minWidth: 0,
        }}
      >
        {/* STROKE GAP paired with the score. The string arrives already signed
            from formatGapFromChampion (see ChampionsDuelCard / the Dispatch
            sheet call sites) - never re-derived here. The ASCII hyphen is
            swapped for a true minus (U+2212) so this column prints the same
            glyph as the full leaderboard sheet's "-n from champion" subline
            (ChampionsListRow.tsx). The sheet keeps that subline on purpose:
            it has room for the word "champion", this five-row panel does not. */}
        {row.gapDisplay ? (
          <span style={{ ...NUM, fontSize: 11, fontWeight: 600, color: A.DIM, textAlign: 'center' }}>
            {row.gapDisplay.replace('-', '\u2212')}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <span aria-hidden />
        <span style={{ ...NUM, fontSize: 16, color: tone, textAlign: 'center' }}>
          {row.valueDisplay}
        </span>
      </span>
    </div>
  );
};

/** Column header row. LABEL style, no rule beneath. */
export const BoardHeaderRow: React.FC<{
  memberLabel: string;
  movementLabel: string;
  unitLabel: string;
  rankLabel: string;
  gapLabel?: string;
  /** Board-level movement state. Must match the rows'. */
  showMovement?: boolean;
}> = ({ memberLabel, movementLabel, unitLabel, rankLabel, gapLabel, showMovement = true }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: boardGrid(showMovement),
      gap: BOARD_GAP,
      paddingBottom: 4,
      fontFamily: SANS,
    }}
  >
    <span
      style={{
        display: 'grid',
        gridTemplateColumns: showMovement ? '22px 4px 20px' : '22px',
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {showMovement && <span style={{ ...LABEL, textAlign: 'center' }}>{movementLabel}</span>}
      {showMovement && <span aria-hidden />}
      <span style={{ ...LABEL, textAlign: 'center' }}>{rankLabel}</span>
    </span>
    <span />
    <span style={{ ...LABEL, textAlign: 'center' }}>{memberLabel}</span>
    <span
      style={{
        display: 'grid',
        gridTemplateColumns: gapLabel ? '32px 4px 46px' : '0px 4px 46px',
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {gapLabel ? <span style={{ ...LABEL, textAlign: 'center' }}>{gapLabel}</span> : <span aria-hidden />}
      <span aria-hidden />
      <span style={{ ...LABEL, textAlign: 'center' }}>{unitLabel}</span>
    </span>
  </div>
);


/** English ordinal suffix. Supplied by the callsite, never built inside a translated string. */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Label pair beneath the held stat row. The amber lead track has been removed:
 * a bar implies a scale, and "you hold it" is already stated by the label.
 */
export const HeldGauge: React.FC<{
  /** Runner-up's position on the member's scale, 0-100. Null = tie, no notch. */
  notchPct: number | null;
  nearestLabel: string;
  holdLabel: string;
}> = ({ notchPct: _notchPct, nearestLabel, holdLabel }) => {
  return (
    <div style={{ margin: '18px 0 2px', fontFamily: SANS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ ...LABEL, fontVariantNumeric: 'tabular-nums lining-nums' }}>{nearestLabel}</span>
        <span style={{ ...LABEL, color: A.AMBER }}>{holdLabel}</span>
      </div>
    </div>
  );
};

/* ============================================================================
 * BRIEF_CHAMPIONS_SHEET_MATCHES_BOARD — THE ONE CHAMPIONS ROW.
 *
 * The Champions board on the tab and the full-course leaderboard sheet held
 * separate copies of this row and drifted. There is now exactly one:
 *   [MOVEMENT?] [POS] [avatar] [MEMBER] [WHEN] [MARK]
 * POS is centred over the numerals alone; MOVEMENT is an unheaded column
 * OUTSIDE it, present only when the category's window is 90 days.
 *
 * What the SHEET adds through props, not through a fork: a subline under the
 * member (the gap from the champion) and the NEW badge. The board passes
 * neither, so its rows are unchanged.
 * ========================================================================== */

const MINUS = '\u2212';

export const championsGrid = (movement: boolean) =>
  `${movement ? '26px ' : ''}34px 26px 1fr 58px 62px`;
export const CHAMPIONS_GAP = 10;
export const CHAMPIONS_ROW_PADDING_X = 16;

/** 90-DAY vs ALL-TIME is read from the category's window, not its name. */
export function categoryWindowDays(cat: string): number | null {
  return String(cat).endsWith('_90d') ? 90 : null;
}

/** Gross categories are the only ones with a to-par to state. */
export function hasToPar(cat: string): boolean {
  return String(cat).startsWith('lowest_gross');
}

export function formatToPar(value: number, par: number): string {
  const d = Math.round(value - par);
  if (d === 0) return 'E';
  return d > 0 ? `+${d}` : `${MINUS}${Math.abs(d)}`;
}

export function toParColor(value: number, par: number): string {
  const d = Math.round(value - par);
  if (d < 0) return A.RED;
  if (d === 0) return A.DIM;
  return A.MUTE;
}

export function formatChampionsWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
}

/** Positions with proper tie handling: 1, T3, T3, 5. */
export function positionsFor(rows: ReadonlyArray<{ value: number }>): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].value === rows[i].value) j += 1;
    const pos = i + 1;
    const tied = j > i;
    for (let k = i; k <= j; k += 1) out.push(tied ? `T${pos}` : String(pos));
    i = j + 1;
  }
  return out;
}

export interface ChampionsRowData {
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  userId?: string | null;
  rank30d?: number | null;
  delta?: number | null;
}

export const ChampionsRow: React.FC<{
  row: ChampionsRowData;
  /** Tie-aware position string: "1", "T2", … */
  pos: string;
  /** Board-level, gated on the category's window. Never branch per row. */
  showMovement?: boolean;
  /** Gross categories only, and only when the course par is known. */
  coursePar?: number | null;
  showToPar?: boolean;
  /** Hairline above the row. False for the first row of a board. */
  rule?: boolean;
  /** SHEET ONLY — the gap from the champion, already signed. */
  subline?: string | null;
  /** SHEET ONLY — a mark set within NEW_BADGE_DAYS. */
  isNew?: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
}> = ({
  row,
  pos,
  showMovement = false,
  coursePar = null,
  showToPar = false,
  rule = true,
  subline = null,
  isNew = false,
  rowRef,
}) => {
  const tone = row.isSelf ? A.AMBER : A.INK;
  return (
    <div
      ref={rowRef}
      style={{
        display: 'grid',
        gridTemplateColumns: championsGrid(showMovement),
        gap: CHAMPIONS_GAP,
        alignItems: 'center',
        padding: `9px ${CHAMPIONS_ROW_PADDING_X}px`,
        fontFamily: SANS,
        background: row.isSelf ? 'rgba(247,147,30,0.07)' : undefined,
        borderTop: rule ? `1px solid ${A.HAIRLINE}` : undefined,
      }}
    >
      {showMovement && (
        <span style={{ display: 'flex', justifyContent: 'center' }}>
          <MovementCell delta={row.delta} rank30d={row.rank30d} theme="dark" size="figure" />
        </span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {pos === '1' && (
          <Crown size={12} strokeWidth={2.5} fill={A.AMBER} style={{ color: A.AMBER, flexShrink: 0 }} />
        )}
        <span style={{ ...NUM, fontSize: 12.5, color: row.isSelf ? A.AMBER : A.DIM }}>{pos}</span>
      </span>
      <BoardAvatar photoUrl={row.photoUrl} name={row.name} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: tone,
              letterSpacing: '-0.01em',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.name}
          </span>
          {isNew && (
            <span
              style={{
                ...LABEL,
                fontSize: 8.5,
                letterSpacing: '0.10em',
                color: A.GREEN,
                flexShrink: 0,
              }}
            >
              NEW
            </span>
          )}
        </span>
        {subline && (
          <span
            style={{
              ...NUM,
              display: 'block',
              marginTop: 2,
              fontSize: 10.5,
              fontWeight: 600,
              color: A.DIM,
              lineHeight: 1,
            }}
          >
            {`${subline.replace('-', MINUS)} from champion`}
          </span>
        )}
      </span>
      <span style={{ ...LABEL, fontSize: 10.5, color: A.DIM, textAlign: 'right' }}>
        {formatChampionsWhen(row.attained_at)}
      </span>
      <span style={{ textAlign: 'right', minWidth: 0 }}>
        <span style={{ ...NUM, fontSize: 15, fontWeight: 700, color: tone, display: 'block', lineHeight: 1 }}>
          {row.valueDisplay}
        </span>
        {showToPar && coursePar != null && (
          <span
            style={{
              ...NUM,
              fontSize: 10.5,
              display: 'block',
              marginTop: 2,
              lineHeight: 1,
              color: row.isSelf ? A.AMBER : toParColor(row.value, coursePar),
            }}
          >
            {formatToPar(row.value, coursePar)}
          </span>
        )}
      </span>
    </div>
  );
};

/** Column headers for ChampionsRow. POS centred over the numerals alone. */
export const ChampionsColumnHeader: React.FC<{
  showMovement?: boolean;
  posLabel: string;
  memberLabel: string;
  whenLabel: string;
  markLabel: string;
}> = ({ showMovement = false, posLabel, memberLabel, whenLabel, markLabel }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: championsGrid(showMovement),
      gap: CHAMPIONS_GAP,
      padding: `0 ${CHAMPIONS_ROW_PADDING_X}px 5px`,
      fontFamily: SANS,
    }}
  >
    {showMovement && <span aria-hidden />}
    <span style={{ ...LABEL, textAlign: 'center' }}>{posLabel}</span>
    <span aria-hidden />
    <span style={{ ...LABEL }}>{memberLabel}</span>
    <span style={{ ...LABEL, textAlign: 'right' }}>{whenLabel}</span>
    <span style={{ ...LABEL, textAlign: 'right' }}>{markLabel}</span>
  </div>
);
