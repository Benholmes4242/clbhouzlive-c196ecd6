/**
 * ContourCover — the cover fallback when no photograph exists: fairway green
 * under faint contour lines. Every ring is computed once at module load from
 * fixed constants, so the artwork is deterministic — the same for everyone,
 * with no randomness. Consumers add PhotoBandFade on top exactly as they do
 * over a photograph.
 */
import React from 'react';

const CENTER_X = 250;
const CENTER_Y = 120;
const RING_COUNT = 14;
const STEP_DEG = 10;

/** One closed ring: base radius r = 18 + 17k, one point every 10°. */
function ringPoints(k: number): string {
  const r = 18 + 17 * k;
  const pts: string[] = [];
  for (let deg = 0; deg <= 360; deg += STEP_DEG) {
    const a = (deg * Math.PI) / 180;
    const rr = r * (1 + 0.18 * Math.sin(3 * a + 0.4 * k) + 0.08 * Math.cos(5 * a));
    const x = CENTER_X + 1.35 * rr * Math.cos(a);
    const y = CENTER_Y + rr * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Stroke 1px, no fill; every fourth ring reads a touch brighter. */
const CONTOURS = Array.from({ length: RING_COUNT }, (_, k) => ({
  k,
  points: ringPoints(k),
  stroke: k % 4 === 0 ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)',
}));

export const CONTOUR_COVER_GRADIENT = 'linear-gradient(165deg, #33503b 0%, #1f2e25 50%, #0A0A0C 100%)';

export const ContourCover: React.FC = () => (
  <div aria-hidden data-contour-cover style={{ position: 'absolute', inset: 0, background: CONTOUR_COVER_GRADIENT }}>
    <svg
      viewBox="0 0 390 255"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    >
      {CONTOURS.map((c) => (
        <polyline key={c.k} data-contour-ring={c.k} points={c.points} fill="none" stroke={c.stroke} strokeWidth={1} />
      ))}
    </svg>
  </div>
);

export default ContourCover;
