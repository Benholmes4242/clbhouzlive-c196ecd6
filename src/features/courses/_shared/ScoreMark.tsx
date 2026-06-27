import React from 'react';
import {
  SC_ACE,
  SC_ALBATROSS,
  SC_EAGLE,
  SC_BIRDIE,
  SC_PAR,
  SC_BOGEY,
  SC_DOUBLE,
} from '@/features/courses/components/holes/_constants';

/**
 * ScoreMark — the universal scoring-mark renderer.
 *
 * Refined-outline shape system, shared across:
 *  • Tour scorecard sheet (PlayerScorecardSheet)
 *  • Handicap personal scorecard (RoundHoleCell)
 *  • Champions/Holes badges (where applicable)
 *
 * Shapes encode the tier, depth (rings) encodes severity, colour comes from
 * the refined SC_* palette. Par is bare ink in muted slate — nearly invisible.
 */

type Variant =
  | 'empty'
  | 'par'
  | 'birdie'
  | 'eagle'
  | 'alba'
  | 'hio'
  | 'bogey'
  | 'doub'
  | 'triple';

const variantFor = (strokes: number | null | undefined, par: number): Variant => {
  if (strokes == null) return 'empty';
  if (strokes === 1) return 'hio';
  const diff = strokes - par;
  if (diff <= -3) return 'alba';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'doub';
  return 'triple';
};

interface VariantSpec {
  shape: 'circle' | 'square' | 'triangle' | null;
  depth: 0 | 1 | 2 | 3;
  colour: string;
}

const SPECS: Record<Variant, VariantSpec> = {
  empty:  { shape: null,       depth: 0, colour: '#CBD5E1' },
  par:    { shape: null,       depth: 0, colour: SC_PAR },
  birdie: { shape: 'circle',   depth: 1, colour: SC_BIRDIE },
  eagle:  { shape: 'circle',   depth: 2, colour: SC_EAGLE },
  alba:   { shape: 'circle',   depth: 3, colour: SC_ALBATROSS },
  hio:    { shape: 'circle',   depth: 3, colour: SC_ACE },
  bogey:  { shape: 'square',   depth: 1, colour: SC_BOGEY },
  doub:   { shape: 'square',   depth: 2, colour: SC_DOUBLE },
  triple: { shape: 'square',   depth: 3, colour: SC_DOUBLE },
};

const Shape: React.FC<{
  kind: 'circle' | 'square' | 'triangle';
  insetVB: number;
  stroke: string;
  strokeVB: number;
}> = ({ kind, insetVB, stroke, strokeVB }) => {
  const half = strokeVB / 2;
  const common = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    overflow: 'visible' as const,
  };

  if (kind === 'circle') {
    const r = 50 - insetVB - half;
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={common} aria-hidden>
        <circle cx={50} cy={50} r={r} fill="none" stroke={stroke} strokeWidth={strokeVB} />
      </svg>
    );
  }

  if (kind === 'triangle') {
    const m = insetVB + half;
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={common} aria-hidden>
        <polygon
          points={`50,${m} ${m},${100 - m} ${100 - m},${100 - m}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeVB}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const origin = insetVB + half;
  const dim = 100 - 2 * insetVB - strokeVB;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={common} aria-hidden>
      <rect x={origin} y={origin} width={dim} height={dim} fill="none" stroke={stroke} strokeWidth={strokeVB} />
    </svg>
  );
};

export interface ScoreMarkProps {
  strokes: number | null | undefined;
  par: number;
  /** Visual size of the mark tile in px. Defaults to 38. */
  size?: number;
  /** Render the stroke numeral inside the mark. Defaults to true. */
  showStroke?: boolean;
  /** Override colour resolution (e.g. monochrome contexts). */
  colourOverride?: string;
  /** Custom font for the numeral. */
  fontFamily?: string;
}

const FONT_GEIST = "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

export const ScoreMark: React.FC<ScoreMarkProps> = ({
  strokes,
  par,
  size = 38,
  showStroke = true,
  colourOverride,
  fontFamily = FONT_GEIST,
}) => {
  const variant = variantFor(strokes, par);
  const spec = SPECS[variant];
  const colour = colourOverride ?? spec.colour;

  // Stroke calibrated so at size=38 the line is ~1.5px; scales with size.
  const STROKE_PX = Math.max(1.1, size * (1.5 / 38));
  const STROKE_VB = STROKE_PX * (100 / size);
  // Inset depths in viewBox units (tuned for refined-outline rings).
  const INSET_2 = 12;
  const INSET_3 = 22;

  const numeral = strokes == null ? '·' : strokes;
  const numColour =
    strokes == null
      ? '#CBD5E1'
      : variant === 'par'
      ? SC_PAR
      : colour;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {spec.shape && (
        <>
          <Shape kind={spec.shape} insetVB={0} stroke={colour} strokeVB={STROKE_VB} />
          {spec.depth >= 2 && (
            <Shape kind={spec.shape} insetVB={INSET_2} stroke={colour} strokeVB={STROKE_VB} />
          )}
          {spec.depth >= 3 && (
            <Shape kind={spec.shape} insetVB={INSET_3} stroke={colour} strokeVB={STROKE_VB} />
          )}
        </>
      )}
      {showStroke && (
        <span
          style={{
            position: 'relative',
            fontFamily,
            fontSize: Math.round(size * 0.38),
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: numColour,
          }}
        >
          {numeral}
        </span>
      )}
    </div>
  );
};

export default ScoreMark;
