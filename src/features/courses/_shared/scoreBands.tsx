/**
 * The one colour scale for member score values (0-10), app-wide.
 * Used by the review composer, the Top 100 stats panel and course detail.
 * Do not re-declare these hexes anywhere else.
 *
 * NOTE: this is NOT the difficulty band scale (#C8372B / #0F8F4A) — that
 * measures a different quantity and lives in Top100CourseStatsPanel.
 */
import React from 'react';

export const BAND_GREEN = '#047857';
export const BAND_AMBER = '#F7931E';
export const BAND_RED = '#DC2626';

/** >= 9.0 green, >= 5.0 amber, below 5.0 red. */
export function bandColor(score: number | null | undefined): string {
  if (score == null) return '#AEB4BC';
  if (score >= 9) return BAND_GREEN;
  if (score >= 5) return BAND_AMBER;
  return BAND_RED;
}

const LABEL_INK = 'rgba(15,23,42,0.42)';
const TRACK = 'rgba(15,23,42,0.08)';
/** Numerals stay in the SF Pro stack: monospace faces slash their zeros. */
const MONO = 'inherit';

const NUMERALS: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

const barLabelStyle: React.CSSProperties = {
  width: 54,
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 600,
  color: LABEL_INK,
  whiteSpace: 'nowrap',
  lineHeight: 1,
};

const barFigureStyle: React.CSSProperties = {
  ...NUMERALS,
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

export const SubScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
    <span style={barLabelStyle}>{label}</span>
    <div style={{ flex: 1, height: 3, borderRadius: 2, background: TRACK, minWidth: 0 }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, (score / 10) * 100))}%`,
          height: '100%',
          borderRadius: 2,
          background: bandColor(score),
        }}
      />
    </div>
    <span style={{ ...barFigureStyle, color: bandColor(score) }}>{score.toFixed(1)}</span>
  </div>
);
