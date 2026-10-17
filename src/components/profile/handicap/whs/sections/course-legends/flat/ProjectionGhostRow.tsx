/** An unranked projection, never a FlatRow or input to real rank calculation. */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SURFACE } from '@/lib/tokens/surface';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
export function ProjectionGhostRow({ value, initials, leader }: { value: number; initials: string; leader: number | null }) {
  const gap = leader == null ? null : Number(Math.abs(leader - value).toFixed(1));
  return <div className="champions-ghost" data-projection-ghost style={{ color: A.AMBER, background: `color-mix(in srgb, ${A.AMBER} 10%, transparent)`, borderBottom: `1px dashed color-mix(in srgb, ${A.AMBER} 34%, transparent)` }}>
    <span data-ghost-rank />
    <span className="champions-ghost-avatar"><span>{initials}</span><span aria-hidden className="champions-ghost-ring" style={{ border: `1px dashed color-mix(in srgb, ${A.AMBER} 50%, transparent)` }} /></span>
    <span className="champions-ghost-name"><b>You would sit here</b><span style={{ color: inkWithAlpha(SURFACE.dark.ink, 0.3) }}>Projected, not played</span></span>
    <span className="champions-ghost-value"><b>{Number(value.toFixed(1))}</b>{gap != null && <span>{gap} {value < (leader ?? value) ? 'better' : value > (leader ?? value) ? 'off' : 'level'}</span>}</span>
  </div>;
}
export function ghostInsertionIndex(rows: readonly { value: number }[], value: number): number {
  // All projectable categories are lower-is-better. Equal real scores stay first.
  const index = rows.findIndex(row => row.value > value);
  return index < 0 ? rows.length : index;
}