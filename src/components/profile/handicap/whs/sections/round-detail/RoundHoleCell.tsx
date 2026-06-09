import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  hole: WhsScoreHole;
  showPar?: boolean;
}

// ─── Design tokens ─────────────────────────────────────────────────────
const INK = 'var(--hcp-t-100)';
const INK_55 = 'var(--hcp-t-60)';
const INK_40 = 'var(--hcp-t-40)';
const HAIRLINE = 'var(--hcp-line-2)';
const UNDER = '#FFFFFF';
const OVER = '#f87171';
const PAR_RING = 'rgba(255,255,255,0.18)';

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
  par:    { shape: null,     depth: 0, stroke: PAR_RING },
  birdie: { shape: 'circle', depth: 1, stroke: UNDER },
  eagle:  { shape: 'circle', depth: 2, stroke: UNDER },
  alba:   { shape: 'circle', depth: 3, stroke: UNDER },
  hio:    { shape: 'circle', depth: 3, stroke: UNDER },
  bogey:  { shape: 'square', depth: 1, stroke: OVER },
  doub:   { shape: 'square', depth: 2, stroke: OVER },
  triple: { shape: 'square', depth: 3, stroke: OVER },
};

/**
 * Shape primitive — renders in a 100×100 viewBox, scales with container.
 *
 * Stroke width is in viewBox units (not screen pixels) — calibrated so
 * that at the 44px maxWidth cap the stroke renders at the original
 * 1.5px target. Geometry is inset by half the stroke width so the full
 * stroke sits INSIDE the viewBox (no edge clipping).
 */
const STROKE_VB = 1.5 * (100 / 44); // ≈ 3.41 viewBox units
const STROKE_HALF = STROKE_VB / 2;

const Shape: React.FC<{
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
}> = ({ kind, inset, stroke }) => {
  const insetVB = inset * (100 / 44);

  if (kind === 'circle') {
    const r = 50 - insetVB - STROKE_HALF;
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        aria-hidden
      >
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_VB}
        />
      </svg>
    );
  }

  const origin = insetVB + STROKE_HALF;
  const dim = 100 - 2 * insetVB - STROKE_VB;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden
    >
      <rect
        x={origin}
        y={origin}
        width={dim}
        height={dim}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_VB}
      />
    </svg>
  );
};

// ─── RoundHoleCell ─────────────────────────────────────────────────────
export const RoundHoleCell: React.FC<Props> = ({ hole, showPar = true }) => {
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
          color: 'var(--hcp-t-60)',
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
          maxWidth: 38,
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
            fontSize: 'clamp(12px, 3.4vw, 15px)',
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

      {/* Par label — below the tile */}
      {showPar && hole.par != null && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: INK_40,
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          par {hole.par}
        </span>
      )}
    </div>
  );
};

export default RoundHoleCell;
