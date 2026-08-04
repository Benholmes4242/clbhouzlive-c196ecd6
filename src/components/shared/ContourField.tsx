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

/** Three broad families, deliberately offset so no seam or tile is legible. */
const FAMILIES: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  rings: number;
  step: number;
}[] = [
  { cx: 30, cy: 90, rx: 130, ry: 175, rot: -16, rings: 5, step: 58 },
  { cx: 400, cy: 520, rx: 165, ry: 125, rot: 24, rings: 5, step: 62 },
  { cx: 90, cy: 990, rx: 150, ry: 195, rot: -4, rings: 4, step: 66 },
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
