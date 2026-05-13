import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  hole: WhsScoreHole;
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

/**
 * Shape primitive — renders in a 100×100 viewBox so it scales with its
 * container. Inset is expressed in viewBox units (0–100) so the existing
 * INSET_DOUBLE / INSET_TRIPLE constants below are scaled up by ~2.27 here.
 *
 * Uses vector-effect="non-scaling-stroke" so the stroke width stays
 * crisp regardless of how small the cell renders.
 */
const Shape: React.FC<{
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
}> = ({ kind, inset, stroke }) => {
  // The inset constants below were calibrated for a 44px cell.
  // Convert to viewBox units (44 → 100): multiply by 100/44 = ~2.273.
  const insetVB = inset * (100 / 44);

  if (kind === 'circle') {
    const r = 50 - insetVB;
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden
      >
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_W}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  const dim = 100 - 2 * insetVB;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      <rect
        x={insetVB}
        y={insetVB}
        width={dim}
        height={dim}
        rx={4.5}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_W}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// ─── RoundHoleCell ─────────────────────────────────────────────────────
export const RoundHoleCell: React.FC<Props> = ({ hole }) => {
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

      {/* Tile — fills the grid column width, square via aspect-ratio.
          Caps at 44px on wide viewports so the tiles don't get huge. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 44,
          aspectRatio: '1 / 1',
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
            <Shape kind={spec.shape} inset={0} stroke={spec.stroke} />
            {spec.depth >= 2 && (
              <Shape kind={spec.shape} inset={INSET_DOUBLE} stroke={spec.stroke} />
            )}
            {spec.depth >= 3 && (
              <Shape kind={spec.shape} inset={INSET_TRIPLE} stroke={spec.stroke} />
            )}
          </>
        )}

        {/* Score numeral — font scales subtly with cell width via clamp() */}
        <span
          style={{
            position: 'relative',
            fontSize: 'clamp(14px, 3.8vw, 17px)',
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
