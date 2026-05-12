import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  hole: WhsScoreHole;
  /** Outer cell size in px. Defaults to 44. */
  size?: number;
}

// ─── Design tokens ─────────────────────────────────────────────────────
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const HAIRLINE = 'rgba(15,23,42,0.16)';
const AMBER = '#F7931E';

const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// Universal stroke width — single, double, triple ALL use this.
// Depth is achieved by adding shapes, never by thickening lines.
const STROKE_W = 1.5;

// Inner-shape inset for nested shapes
const INSET_DOUBLE = 4;
const INSET_TRIPLE = 7;

// ─── Variant resolution ────────────────────────────────────────────────
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

const variantFor = (strokes: number | null, par: number): Variant => {
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
  shape: 'circle' | 'square' | null;
  depth: 0 | 1 | 2 | 3;
  stroke: string;
}

const SPECS: Record<Variant, VariantSpec> = {
  empty:  { shape: null,     depth: 0, stroke: HAIRLINE },
  par:    { shape: null,     depth: 0, stroke: HAIRLINE },
  birdie: { shape: 'circle', depth: 1, stroke: AMBER },
  eagle:  { shape: 'circle', depth: 2, stroke: AMBER },
  alba:   { shape: 'circle', depth: 3, stroke: AMBER },
  hio:    { shape: 'circle', depth: 3, stroke: AMBER },
  bogey:  { shape: 'square', depth: 1, stroke: INK },
  doub:   { shape: 'square', depth: 2, stroke: INK },
  triple: { shape: 'square', depth: 3, stroke: INK },
};

// ─── Shape primitive ───────────────────────────────────────────────────
const Shape: React.FC<{
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
  size: number;
}> = ({ kind, inset, stroke, size }) => {
  if (kind === 'circle') {
    const r = size / 2 - inset - STROKE_W / 2;
    return (
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_W}
        />
      </svg>
    );
  }
  const dim = size - 2 * inset - STROKE_W;
  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden
    >
      <rect
        x={inset + STROKE_W / 2}
        y={inset + STROKE_W / 2}
        width={dim}
        height={dim}
        rx={2}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_W}
      />
    </svg>
  );
};

// ─── RoundHoleCell ─────────────────────────────────────────────────────
export const RoundHoleCell: React.FC<Props> = ({ hole, size = 44 }) => {
  const strokes = hole.played
    ? (hole.adjusted_gross ?? hole.actual_gross ?? null)
    : null;
  const variant = variantFor(strokes, hole.par);
  const spec = SPECS[variant];

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontFamily: FONT_GEIST,
      }}
    >
      {/* Hole number — above the tile */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: INK_55,
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {hole.hole_no}
      </span>

      {/* Tile */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Empty placeholder — dashed square */}
        {variant === 'empty' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `${STROKE_W}px dashed ${HAIRLINE}`,
              borderRadius: 3,
            }}
          />
        )}

        {/* Par placeholder — solid hairline square */}
        {variant === 'par' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `${STROKE_W}px solid ${HAIRLINE}`,
              borderRadius: 3,
            }}
          />
        )}

        {/* Shape(s) for non-par variants */}
        {spec.shape && (
          <>
            <Shape kind={spec.shape} inset={0} stroke={spec.stroke} size={size} />
            {spec.depth >= 2 && (
              <Shape kind={spec.shape} inset={INSET_DOUBLE} stroke={spec.stroke} size={size} />
            )}
            {spec.depth >= 3 && (
              <Shape kind={spec.shape} inset={INSET_TRIPLE} stroke={spec.stroke} size={size} />
            )}
          </>
        )}

        {/* Score numeral */}
        <span
          style={{
            position: 'relative',
            fontSize: 17,
            fontWeight: 700,
            color: strokes == null ? INK_40 : INK,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {strokes == null ? '\u2014' : strokes}
        </span>
      </div>
    </div>
  );
};

export default RoundHoleCell;
