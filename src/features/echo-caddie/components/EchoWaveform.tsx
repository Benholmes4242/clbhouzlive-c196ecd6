/**
 * BRIEF_ECHO_CADDIE §6.1 — Echo's mark.
 *
 * ANIMATES ONLY WHILE THINKING OR SPEAKING. Static everywhere else: a
 * permanently animating logo is a distraction, not a brand.
 *
 * The animation lives in echo-caddie.css so prefers-reduced-motion can hold the
 * bars at a fixed height instead of animating them. Do not reintroduce an
 * inline <style> block — that was the old AnimatedEchoWave and it could not
 * honour the media query without duplicating every keyframe.
 *
 * AMBER HERE IS THE MARK (§7). It is one of exactly two amber roles on this
 * surface; the other is the member's own figures.
 */

import React from 'react';
import { EC } from '../tokens';

interface Bar {
  x: number;
  base: number;
  lo: number;
  hi: number;
  rest: number;
  delay: number;
}

const BARS: Bar[] = [
  { x: 1.0,  base: 0.30, lo: 0.25, hi: 0.65, rest: 0.55, delay: 0 },
  { x: 4.5,  base: 0.55, lo: 0.40, hi: 1.05, rest: 0.75, delay: 100 },
  { x: 8.0,  base: 0.80, lo: 0.55, hi: 1.15, rest: 0.85, delay: 200 },
  { x: 11.5, base: 1.00, lo: 0.65, hi: 1.20, rest: 0.95, delay: 300 },
  { x: 15.0, base: 0.75, lo: 0.50, hi: 1.10, rest: 0.80, delay: 150 },
  { x: 18.5, base: 1.00, lo: 0.65, hi: 1.20, rest: 0.95, delay: 300 },
  { x: 22.0, base: 0.80, lo: 0.55, hi: 1.15, rest: 0.85, delay: 200 },
  { x: 25.5, base: 0.55, lo: 0.40, hi: 1.05, rest: 0.75, delay: 100 },
  { x: 29.0, base: 0.30, lo: 0.25, hi: 0.65, rest: 0.55, delay: 0 },
];

export const EchoWaveform: React.FC<{
  size?: number;
  /** True ONLY while Echo is thinking or speaking. */
  active?: boolean;
  color?: string;
}> = ({ size = 34, active = false, color = EC.AMBER }) => {
  const viewH = 32;
  const barW = 2.4;
  const maxBarH = viewH * 0.75;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 32 ${viewH}`}
      fill="none"
      aria-hidden
      className={active ? 'ec-wave ec-wave--active' : 'ec-wave'}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {BARS.map((b, i) => {
        const h = b.base * maxBarH;
        const y = (viewH - h) / 2;
        return (
          <rect
            key={i}
            className="ec-wave-bar"
            x={b.x}
            y={y}
            width={barW}
            height={h}
            rx={barW / 2}
            fill={color}
            style={
              {
                transformOrigin: `${b.x + barW / 2}px ${viewH / 2}px`,
                '--lo': b.lo,
                '--hi': b.hi,
                '--rest': b.rest,
                '--delay': `${b.delay}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </svg>
  );
};
