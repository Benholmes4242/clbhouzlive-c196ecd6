/**
 * BRIEF_ECHO_CADDIE §4.3 — THE CHART IS THE APP'S OWN.
 *
 * Same construction as the Course tab's eighteen-hole bar chart: the DEMANDING
 * RAMP, SIX DISCRETE STOPS, STEPPED — never interpolated. The ramp is IMPORTED
 * from its single definition; nothing here declares one.
 *
 * The member's own hole is picked out in AMBER — that is the member's own
 * figure, the only other amber role on this surface besides Echo's mark.
 */

import React from 'react';
import { difficultyRampStop, DIFFICULTY_RAMP } from '@/features/courses/components/holes/analytical/tokens';
import { EC, T } from '../tokens';

export interface HoleDatum {
  holeNo: number;
  /** The member's average shots over par on that hole. */
  avgToPar: number;
}

/** Stepped position on the member's OWN spread — six stops, no blend. */
function stopFor(v: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  const t = (v - min) / (max - min);
  return Math.round(Math.max(0, Math.min(1, t)) * (DIFFICULTY_RAMP.length - 1));
}

export const HolesBar: React.FC<{
  holes: HoleDatum[];
  /** Hole to pick out as the member's own. */
  highlightHole?: number | null;
  height?: number;
}> = ({ holes, highlightHole = null, height = 92 }) => {
  if (holes.length === 0) return null;
  const values = holes.map((h) => h.avgToPar);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 0.01);
  const span = Math.max(Math.abs(max), 0.01);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {holes.map((h) => {
          const isMine = highlightHole != null && h.holeNo === highlightHole;
          const mag = Math.max(0.06, Math.min(1, Math.abs(h.avgToPar) / span));
          return (
            <div
              key={h.holeNo}
              style={{
                flex: 1,
                height: `${mag * 100}%`,
                minHeight: 4,
                borderRadius: 2,
                background: isMine ? EC.AMBER : difficultyRampStop(stopFor(h.avgToPar, min, max)),
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
        {holes.map((h) => (
          <span
            key={h.holeNo}
            style={{
              ...T.MICRO,
              flex: 1,
              textAlign: 'center',
              color: highlightHole != null && h.holeNo === highlightHole ? EC.AMBER : EC.INK_3,
            }}
          >
            {h.holeNo}
          </span>
        ))}
      </div>
    </div>
  );
};
