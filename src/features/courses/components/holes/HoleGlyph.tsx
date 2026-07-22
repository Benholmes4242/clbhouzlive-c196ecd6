/**
 * HoleGlyph — the canonical scorecard glyph vocabulary, extracted so the
 * Course Hole Data Sheet, the round-card hole strip, and the notation
 * key all render byte-identical shapes.
 *
 * Grammar (ink-on-white):
 *   eagle-or-better / ace → double gold-gradient ring circle
 *   birdie                → single gold-gradient ring circle
 *   par                   → 20% ink square
 *   bogey                 → 55% ink square
 *   double+               → 85% ink double-ring square
 *
 * A single global <defs> block (HoleGlyphDefs) must be mounted once per
 * surface so the "hsAmberGoldStroke" gradient id resolves.
 */
import React from 'react';

export type HoleGlyphKind =
  | 'eagle-or-better'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double-plus';

const INK_20 = 'rgba(15,23,42,0.20)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_85 = 'rgba(15,23,42,0.85)';
const AMBER_GRAD = 'url(#hsAmberGoldStroke)';
const STRIP_STROKE = 1.4;

interface ShapePathProps {
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
  size: number;
}

const ShapePath: React.FC<ShapePathProps> = ({ kind, inset, stroke, size }) => {
  if (kind === 'circle') {
    const r = size / 2 - inset - STRIP_STROKE / 2;
    if (r <= 0) return null;
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={STRIP_STROKE}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  const dim = size - 2 * inset - STRIP_STROKE;
  if (dim <= 0) return null;
  return (
    <rect
      x={inset + STRIP_STROKE / 2}
      y={inset + STRIP_STROKE / 2}
      width={dim}
      height={dim}
      rx={2}
      ry={2}
      fill="none"
      stroke={stroke}
      strokeWidth={STRIP_STROKE}
      vectorEffect="non-scaling-stroke"
    />
  );
};

export const HoleGlyph: React.FC<{ kind: HoleGlyphKind; size?: number }> = ({
  kind,
  size = 20,
}) => {
  let shape: 'circle' | 'square' = 'square';
  let depth: 1 | 2 = 1;
  let stroke = INK_20;
  switch (kind) {
    case 'eagle-or-better':
      shape = 'circle'; depth = 2; stroke = AMBER_GRAD; break;
    case 'birdie':
      shape = 'circle'; depth = 1; stroke = AMBER_GRAD; break;
    case 'par':
      shape = 'square'; depth = 1; stroke = INK_20; break;
    case 'bogey':
      shape = 'square'; depth = 1; stroke = INK_55; break;
    case 'double-plus':
      shape = 'square'; depth = 2; stroke = INK_85; break;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
      aria-hidden
    >
      <ShapePath kind={shape} inset={0.5} stroke={stroke} size={size} />
      {depth >= 2 && <ShapePath kind={shape} inset={3} stroke={stroke} size={size} />}
    </svg>
  );
};

/** Mount once per surface so the AMBER_GRAD gradient id resolves. */
export const HoleGlyphDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <linearGradient id="hsAmberGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F7931E" />
        <stop offset="100%" stopColor="#FBBC2E" />
      </linearGradient>
    </defs>
  </svg>
);
