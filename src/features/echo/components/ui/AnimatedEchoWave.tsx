/**
 * AnimatedEchoWave — breathing bars waveform for Echo identity
 * Used in: welcome hero (size 44), response card avatar (size 18)
 * NOT used in the header
 */

import React from "react";

interface AnimatedEchoWaveProps {
  size?: number;
  color?: string;
  active?: boolean;
}

const BAR_CONFIG = [
  { x: 1,    baseH: 0.30, delay: 0.00, minScale: 0.25, maxScale: 0.65 },
  { x: 4.5,  baseH: 0.55, delay: 0.10, minScale: 0.40, maxScale: 1.05 },
  { x: 8,    baseH: 0.80, delay: 0.20, minScale: 0.55, maxScale: 1.15 },
  { x: 11.5, baseH: 1.00, delay: 0.30, minScale: 0.65, maxScale: 1.20 },
  { x: 15,   baseH: 0.75, delay: 0.15, minScale: 0.50, maxScale: 1.10 },
  { x: 18.5, baseH: 1.00, delay: 0.30, minScale: 0.65, maxScale: 1.20 },
  { x: 22,   baseH: 0.80, delay: 0.20, minScale: 0.55, maxScale: 1.15 },
  { x: 25.5, baseH: 0.55, delay: 0.10, minScale: 0.40, maxScale: 1.05 },
  { x: 29,   baseH: 0.30, delay: 0.00, minScale: 0.25, maxScale: 0.65 },
];

const AMBER = "#F5A623";

export function AnimatedEchoWave({
  size = 32,
  color = AMBER,
  active = true,
}: AnimatedEchoWaveProps) {
  const viewH = 32;
  const barW = 2.4;
  const maxBarH = viewH * 0.75;

  return (
    <>
      <style>{`
        ${BAR_CONFIG.map((b, i) => `
          @keyframes echo-bar-${i} {
            0%, 100% { transform: scaleY(${b.minScale}); }
            50%       { transform: scaleY(${b.maxScale}); }
          }
        `).join("")}
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 32 ${viewH}`}
        fill="none"
        style={{ overflow: "visible" }}
      >
        {BAR_CONFIG.map((b, i) => {
          const h = b.baseH * maxBarH;
          const y = (viewH - h) / 2;
          return (
            <rect
              key={i}
              x={b.x}
              y={y}
              width={barW}
              height={h}
              rx={barW / 2}
              fill={color}
              style={{
                transformOrigin: `${b.x + barW / 2}px ${viewH / 2}px`,
                animation: active ? `echo-bar-${i} 1.5s ease-in-out infinite` : "none",
                animationDelay: `${b.delay}s`,
              }}
            />
          );
        })}
      </svg>
    </>
  );
}
