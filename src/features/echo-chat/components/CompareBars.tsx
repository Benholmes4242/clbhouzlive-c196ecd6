/**
 * BRIEF_ECHO_CHAT §4.3 — YOUR GOLF: the comparison. THE MEMBER'S BAR IS WHITE
 * AND THE BENCHMARK IS A TICK — a line drawn across the track, not a second
 * coloured bar competing with the member's own figure.
 *
 * §7 no amber anywhere here. §1 every tone is a solid value.
 */

import React from 'react';
import { EC, T } from '../tokens';
import type { CourseBar } from '../hooks/useEchoAnswerData';

const fmt = (v: number) => `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${Math.abs(v).toFixed(1)}`;

export const CompareBars: React.FC<{
  bars: CourseBar[];
  /** The benchmark, drawn as a tick. */
  benchmark: number;
  benchmarkLabel: string;
}> = ({ bars, benchmark, benchmarkLabel }) => {
  if (bars.length === 0) return null;
  const max = Math.max(...bars.map((b) => b.value), benchmark, 0.01);
  const pct = (v: number) => `${Math.max(2, Math.min(100, (v / max) * 100))}%`;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {bars.map((b) => (
        <div key={b.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
            <span
              style={{
                fontSize: 12,
                color: b.mine ? EC.INK : EC.INK_2,
                fontWeight: b.mine ? 700 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </span>
            <span style={{ ...T.FIG, fontSize: 12, color: b.mine ? EC.INK : EC.INK_2 }}>
              {fmt(b.value)}
            </span>
          </div>
          <div style={{ position: 'relative', height: 8, borderRadius: 4, background: EC.RAISED }}>
            <i
              style={{
                position: 'absolute',
                inset: '0 auto 0 0',
                width: pct(b.value),
                borderRadius: 4,
                background: b.mine ? EC.INK : EC.INK_3,
              }}
            />
            {/* The benchmark tick. */}
            <i
              style={{
                position: 'absolute',
                top: -2,
                bottom: -2,
                left: pct(benchmark),
                width: 2,
                background: EC.INK,
              }}
            />
          </div>
        </div>
      ))}
      <div style={{ ...T.MICRO, marginTop: 2 }}>
        {benchmarkLabel} {fmt(benchmark)}
      </div>
    </div>
  );
};
