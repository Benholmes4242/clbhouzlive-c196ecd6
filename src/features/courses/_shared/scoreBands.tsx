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

/**
 * DARK-SURFACE VARIANTS (CORRECTION_REVIEW_TILE_FINISHING §1.3). BAND_GREEN and
 * BAND_RED are tuned for INK ON WHITE and go muddy on the dark glass chips that
 * sit over photography. Same pattern as TOPAR_UNDER_LIGHT / TOPAR_UNDER_DARK:
 * the light values are untouched and remain correct for the sub-score bars, the
 * course meta block and the verdict band. Amber needs no lift — it already
 * clears the glass — so it is deliberately the same hex in both scales.
 */
export const BAND_GREEN_DARK = '#34D399';
export const BAND_AMBER_DARK = BAND_AMBER;
export const BAND_RED_DARK = '#FF6B6B';

/** >= 9.0 green, >= 5.0 amber, below 5.0 red. */
export function bandColor(score: number | null | undefined): string {
  if (score == null) return '#AEB4BC';
  if (score >= 9) return BAND_GREEN;
  if (score >= 5) return BAND_AMBER;
  return BAND_RED;
}

/** The same scale, legible on dark glass / photography. */
export function bandColorOnDark(score: number | null | undefined): string {
  if (score == null) return 'rgba(255,255,255,0.70)';
  if (score >= 9) return BAND_GREEN_DARK;
  if (score >= 5) return BAND_AMBER_DARK;
  return BAND_RED_DARK;
}


const LABEL_INK = 'rgba(248,250,252,0.42)';
const TRACK = 'rgba(255,255,255,0.10)';
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
  fontWeight: 700,
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
          background: bandColorOnDark(score),
        }}
      />
    </div>
    <span style={{ ...barFigureStyle, color: bandColorOnDark(score) }}>{score.toFixed(1)}</span>
  </div>
);

/**
 * SubScoreStack — the CONDENSED arrangement (BRIEF_COURSE_META_CONDENSE §3):
 * a quarter-width column with the 3px track on top and the figure + label on
 * one line beneath it. Same bands, same values, only the arrangement differs.
 */
export const SubScoreStack: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ height: 3, borderRadius: 2, background: TRACK }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, (score / 10) * 100))}%`,
          height: '100%',
          borderRadius: 2,
          background: bandColorOnDark(score),
        }}
      />
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 4,
        marginTop: 4,
        minWidth: 0,
      }}
    >
      <span style={{ ...barFigureStyle, color: bandColorOnDark(score) }}>{score.toFixed(1)}</span>
      <span
        style={{
          ...barLabelStyle,
          width: 'auto',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
    </div>
  </div>
);

