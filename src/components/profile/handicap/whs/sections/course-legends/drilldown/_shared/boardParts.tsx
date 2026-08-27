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
          display: 'flex',
          alignItems: 'center',
          justifyContent: showMovement ? 'space-between' : 'center',
          gap: 6,
        }}
      >
        {showMovement && (
          <MovementCell delta={row.delta} rank30d={row.rank30d} theme="dark" size="figure" />
        )}
        <span style={{ ...NUM, fontSize: 12.5, color: A.DIM }}>{row.rank}</span>
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
        }}
      >
        {row.name}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'flex-end',
          gap: 6,
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
          <span style={{ ...NUM, fontSize: 11, fontWeight: 600, color: A.DIM }}>
            {row.gapDisplay.replace('-', '\u2212')}
          </span>
        ) : null}
        <span style={{ ...NUM, fontSize: 16, color: tone, textAlign: 'right' }}>
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: showMovement ? 'space-between' : 'center',
        gap: 6,
      }}
    >
      {showMovement && <span style={LABEL}>{movementLabel}</span>}
      <span style={LABEL}>{rankLabel}</span>
    </span>
    <span />
    <span style={LABEL}>{memberLabel}</span>
    <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 6 }}>
      {gapLabel ? <span style={LABEL}>{gapLabel}</span> : null}
      <span style={{ ...LABEL, textAlign: 'right' }}>{unitLabel}</span>
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
