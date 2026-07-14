import React from 'react';
import {
  SC_ACE,
  SC_ALBATROSS,
  SC_EAGLE,
  SC_BIRDIE,
  SC_PAR,
  SC_BOGEY,
  SC_DOUBLE,
  MONO,
} from '@/features/courses/components/holes/_constants';
import { INK, INK_MUTE } from '@/features/courses/_shared/tokens';
import type { SharedHoleDistribution } from './types';

type Mode = 'bar' | 'chart';

interface Props {
  dist: SharedHoleDistribution;
  mode?: Mode;
  height?: number;
  /**
   * When true (chart mode only), heights animate from 0 on mount. Parent
   * flips this on the RAF after expansion so the columns rise cleanly.
   */
  mounted?: boolean;
}

// Thin stacked 7-seg bar (bar mode).
const BAR_SEGS: Array<{ k: keyof SharedHoleDistribution; c: string }> = [
  { k: 'ace',       c: SC_ACE },
  { k: 'albatross', c: SC_ALBATROSS },
  { k: 'eagle',     c: SC_EAGLE },
  { k: 'birdie',    c: SC_BIRDIE },
  { k: 'par',       c: SC_PAR },
  { k: 'bogey',     c: SC_BOGEY },
  { k: 'double',    c: SC_DOUBLE },
];

// Chart columns (chart mode) — EAG folds ace+albatross+eagle visually.
const CHART_COLS: Array<{ id: string; label: string; color: string }> = [
  { id: 'eag',  label: 'EAG',  color: SC_EAGLE },
  { id: 'bird', label: 'BIRD', color: SC_BIRDIE },
  { id: 'par',  label: 'PAR',  color: SC_PAR },
  { id: 'bog',  label: 'BOG',  color: SC_BOGEY },
  { id: 'dbl',  label: 'DBL+', color: SC_DOUBLE },
];

function chartValuesFor(dist: SharedHoleDistribution): number[] {
  return [
    (dist.ace ?? 0) + (dist.albatross ?? 0) + (dist.eagle ?? 0),
    dist.birdie ?? 0,
    dist.par ?? 0,
    dist.bogey ?? 0,
    dist.double ?? 0,
  ];
}

export const SharedHoleDistributionBar: React.FC<Props> = ({
  dist,
  mode = 'bar',
  height = 6,
  mounted = true,
}) => {
  if (mode === 'bar') {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height,
          borderRadius: height,
          overflow: 'hidden',
          background: '#eef1f5',
        }}
      >
        {BAR_SEGS.map((s, i) => {
          const v = dist[s.k] ?? 0;
          return v > 0 ? (
            <div
              key={i}
              style={{ width: `${v}%`, background: s.c, height: '100%' }}
            />
          ) : null;
        })}
      </div>
    );
  }

  // Chart mode — vertical 5-column histogram.
  const vals = chartValuesFor(dist);
  const peak = Math.max(0.01, ...vals);

  return (
    <div style={{ position: 'relative', paddingTop: 14 }}>
      {/* Gridlines */}
      <div
        style={{
          position: 'absolute',
          inset: '14px 0 18px 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 1, background: 'rgba(15,23,42,0.05)' }} />
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${CHART_COLS.length}, 1fr)`,
          gap: 8,
          alignItems: 'end',
          height: 68,
        }}
      >
        {CHART_COLS.map((c, i) => {
          const v = vals[i];
          const isZero = v <= 0;
          const targetH = isZero ? 2 : Math.max(3, (v / peak) * 62);
          const showLabel = v >= 0.5;
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                gap: 3,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: isZero ? 'rgba(15,23,42,0.28)' : INK,
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  minHeight: 10,
                }}
              >
                {showLabel ? `${v < 1 ? v.toFixed(1) : v.toFixed(0)}%` : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height: mounted ? targetH : 0,
                  background: isZero ? 'rgba(15,23,42,0.10)' : c.color,
                  borderRadius: 3,
                  transition: 'height 360ms cubic-bezier(.22,.61,.36,1)',
                  transitionDelay: `${i * 28}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div
        style={{
          marginTop: 6,
          display: 'grid',
          gridTemplateColumns: `repeat(${CHART_COLS.length}, 1fr)`,
          gap: 8,
        }}
      >
        {CHART_COLS.map((c) => (
          <div
            key={`${c.id}-lbl`}
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textAlign: 'center',
              color: INK_MUTE,
            }}
          >
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedHoleDistributionBar;
