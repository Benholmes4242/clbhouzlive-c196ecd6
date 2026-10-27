/**
 * Course/review ratings are white, including actively chosen composer values.
 * Absent values keep their existing dim feedback (Ben, 27 Oct 2026).
 *
 * NOTE: this is NOT the difficulty band scale (#C8372B / #0F8F4A) — that
 * measures a different quantity and lives in Top100CourseStatsPanel.
 */
import React from 'react';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
export {
  BAND_GREEN,
  BAND_AMBER,
  BAND_RED,
  BAND_GREEN_DARK,
  BAND_AMBER_DARK,
  BAND_RED_DARK,
} from './scoreBandTokens';

/**
 * DARK-SURFACE VARIANTS (CORRECTION_REVIEW_TILE_FINISHING §1.3). BAND_GREEN and
 * BAND_RED are tuned for INK ON WHITE and go muddy on the dark glass chips that
 * sit over photography. Same pattern as TOPAR_UNDER_LIGHT / TOPAR_UNDER_DARK:
 * the light values are untouched and remain correct for the sub-score bars, the
 * course meta block and the verdict band. Amber needs no lift — it already
 * clears the glass — so it is deliberately the same hex in both scales.
 */
/** White for every set rating; preserve the untouched state. */
export function bandColor(score: number | null | undefined): string {
  if (score == null) return '#AEB4BC';
  return A.INK;
}

/** The same scale, legible on dark glass / photography. */
export function bandColorOnDark(score: number | null | undefined): string {
  if (score == null) return 'rgba(255,255,255,0.70)';
  return A.INK;
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
  /* The label column widens with the type so DESIGN / CONDITION / CLUBHOUSE /
     FACILITIES still fit without touching the track, which stays flex: 1. */
  width: 58,
  flexShrink: 0,
  /* READ floor — these are WORDS (Design, Condition, Clubhouse, Facilities),
     not axis ticks, so they take 11 rather than the AXIS exception. */
  fontSize: 11,
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
          background: courseSubScoreTone(score),
        }}
      />
    </div>
    <span style={{ ...barFigureStyle, color: courseSubScoreTone(score) }}>{score.toFixed(1)}</span>
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
          background: courseSubScoreTone(score),
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
      <span style={{ ...barFigureStyle, color: courseSubScoreTone(score) }}>{score.toFixed(1)}</span>
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

