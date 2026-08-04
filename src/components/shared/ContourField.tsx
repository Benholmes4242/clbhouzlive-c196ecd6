/**
 * ContourField
 *
 * Shared decorative background: loose concentric ellipse families that read as
 * a contour / course-routing map rather than a repeating texture swatch.
 *
 * One inline SVG. No raster asset, no external request. Static markup, so it
 * costs a single paint and nothing on scroll.
 *
 * Callers pass their own opacity. Echo's empty state runs quiet (0.03 - 0.04);
 * the messaging thread canvas is busier and carries more (0.06).
 */

import React from 'react';

const INK = '#1F2428';

/** Four families, deliberately offset so no seam or tile is legible. */
const FAMILIES: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  rings: number;
  step: number;
}[] = [
  { cx: 62, cy: 120, rx: 96, ry: 132, rot: -14, rings: 7, step: 34 },
  { cx: 318, cy: 430, rx: 118, ry: 88, rot: 22, rings: 8, step: 38 },
  { cx: 108, cy: 742, rx: 140, ry: 172, rot: -6, rings: 6, step: 44 },
  { cx: 300, cy: 1010, rx: 104, ry: 128, rot: 34, rings: 7, step: 36 },
];

interface Props {
  /** Stroke opacity for the whole field. */
  opacity?: number;
  /** Stroke colour. Defaults to the analytical ink. */
  color?: string;
  className?: string;
}

export const ContourField: React.FC<Props> = ({
  opacity = 0.05,
  color = INK,
  className,
}) => (
  <svg
    aria-hidden
    focusable="false"
    className={className}
    viewBox="0 0 390 1100"
    preserveAspectRatio="xMidYMid slice"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      opacity,
    }}
  >
    <g fill="none" stroke={color} strokeWidth={1}>
      {FAMILIES.map((f, fi) => (
        <g key={fi} transform={`rotate(${f.rot} ${f.cx} ${f.cy})`}>
          {Array.from({ length: f.rings }, (_, i) => (
            <ellipse
              key={i}
              cx={f.cx}
              cy={f.cy}
              rx={f.rx + i * f.step}
              ry={f.ry + i * f.step * 0.82}
            />
          ))}
        </g>
      ))}
    </g>
  </svg>
);

export default ContourField;
