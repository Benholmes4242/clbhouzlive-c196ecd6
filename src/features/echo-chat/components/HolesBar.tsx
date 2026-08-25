/**
 * BRIEF_ECHO_CHAT §4.2 — THE CHART IS THE APP'S OWN eighteen-hole bar
 * construction, on the DEMANDING RAMP, SIX DISCRETE STOPS, STEPPED never
 * interpolated. The ramp is IMPORTED from its single definition; nothing here
 * declares one.
 *
 * THE MEMBER'S OWN HOLE IS PICKED OUT IN WHITE. Not amber — §7 narrows amber to
 * Echo's mark on this surface and nothing else, chart bars included.
 *
 * CORRECTION TO THE BRIEF (§4.2, answered): the data is the MEMBER'S OWN hole
 * performance at that course, not the field's. There is no field aggregate in
 * echo_get_*, so a course the member has never played renders NO CHART and
 * routes to the no-data block instead.
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
  /** Hole to pick out — the worst one, drawn in white with its figure. */
  highlightHole?: number | null;
  height?: number;
}> = ({ holes, highlightHole = null, height = 74 }) => {
  if (holes.length === 0) return null;
  const values = holes.map((h) => h.avgToPar);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 0.01);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {holes.map((h) => {
          const t = (h.avgToPar - min) / (max - min);
          const mine = highlightHole != null && h.holeNo === highlightHole;
          return (
            <div
              key={h.holeNo}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              {/* AXIS 10: a per-hole coordinate above the bar, not language.
                  The strip stays quiet, as every other hole strip in the app. */}
              {mine && (
                <span style={{ ...T.FIG, fontSize: 10 }}>
                  {h.avgToPar > 0 ? '+' : h.avgToPar < 0 ? '\u2212' : ''}
                  {Math.abs(h.avgToPar).toFixed(1)}
                </span>
              )}
              <i
                style={{
                  width: '100%',
                  height: `${18 + Math.max(0, Math.min(1, t)) * (height - 18)}px`,
                  borderRadius: '3px 3px 1px 1px',
                  background: mine ? EC.INK : difficultyRampStop(stopFor(h.avgToPar, min, max)),
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
        <span style={T.MICRO}>{holes[0].holeNo}</span>
        <span style={T.MICRO}>{holes[holes.length - 1].holeNo}</span>
      </div>
    </div>
  );
};
