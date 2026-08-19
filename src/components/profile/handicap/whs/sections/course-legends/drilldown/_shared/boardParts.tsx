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
 *   - the gauge carries ONE marker and no faces; a bar with photographs on
 *     it cannot be read as a scale
 */
import React from 'react';
import { A, LABEL, NUM, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MovementCell } from './MovementCell';

/** Fixed grid: rank, avatar, name, 30d, value. */
export const BOARD_GRID = '22px 26px 1fr 44px 52px';
export const BOARD_GAP = 10;

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
          border: `1px solid rgba(15,23,42,0.12)`,
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
}

export const BoardRow: React.FC<{
  row: BoardRowData;
  rowRef?: React.Ref<HTMLDivElement>;
  /** Hairline above the row. Callers pass false for the first row of a board. */
  rule?: boolean;
}> = ({ row, rowRef, rule = true }) => {
  const tone = row.isSelf ? A.AMBER : A.INK;
  return (
    <div
      ref={rowRef}
      style={{
        display: 'grid',
        gridTemplateColumns: BOARD_GRID,
        gap: BOARD_GAP,
        alignItems: 'center',
        padding: '9px 0',
        fontFamily: SANS,
        borderTop: rule ? `1px solid ${A.HAIRLINE}` : undefined,
      }}
    >
      <span style={{ ...NUM, fontSize: 12.5, color: A.DIM, textAlign: 'center' }}>{row.rank}</span>
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
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <MovementCell delta={row.delta} rank30d={row.rank30d} theme="light" size="figure" />
      </span>
      <span style={{ ...NUM, fontSize: 16, color: tone, textAlign: 'right' }}>
        {row.valueDisplay}
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
}> = ({ memberLabel, movementLabel, unitLabel, rankLabel }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: BOARD_GRID,
      gap: BOARD_GAP,
      paddingBottom: 4,
      fontFamily: SANS,
    }}
  >
    <span style={{ ...LABEL, textAlign: 'center' }}>{rankLabel}</span>
    <span />
    <span style={LABEL}>{memberLabel}</span>
    <span style={{ ...LABEL, textAlign: 'right' }}>{movementLabel}</span>
    <span style={{ ...LABEL, textAlign: 'right' }}>{unitLabel}</span>
  </div>
);

/**
 * Label pair beneath the chase stat row. The track has been removed: a bar
 * implies a scale, and these categories have no labelled ends.
 */
export const CrownGauge: React.FC<{
  pct: number;
  level: boolean;
  youLabel: string;
  crownLabel: string;
}> = ({ pct: _pct, level: _level, youLabel, crownLabel }) => {
  return (
    <div style={{ margin: '18px 0 2px', fontFamily: SANS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={LABEL}>{youLabel}</span>
        <span style={LABEL}>{crownLabel}</span>
      </div>
    </div>
  );
};

/** English ordinal suffix. Supplied by the callsite, never built inside a translated string. */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * HELD GAUGE (BRIEF_MOVEMENT_RED_AND_HELD_BOARD).
 *
 * When the member holds the crown there is no gap to close, so the track stops
 * being a chase and becomes a LEAD: full amber, with a 2px ink notch at the
 * runner-up's position on the member's own scale. A tie at the top draws NO
 * notch - a notch at 100% is indistinguishable from the end of the track.
 *
 * Amber here means the viewing member, the same rule as everywhere else on
 * this surface.
 */
export const HeldGauge: React.FC<{
  /** Runner-up's position on the member's scale, 0-100. Null = tie, no notch. */
  notchPct: number | null;
  nearestLabel: string;
  holdLabel: string;
}> = ({ nearestLabel, holdLabel }) => {
  return (
    <div style={{ margin: '18px 0 2px', fontFamily: SANS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ ...LABEL, fontVariantNumeric: 'tabular-nums lining-nums' }}>{nearestLabel}</span>
        <span style={{ ...LABEL, color: A.AMBER }}>{holdLabel}</span>
      </div>
    </div>
  );
};
