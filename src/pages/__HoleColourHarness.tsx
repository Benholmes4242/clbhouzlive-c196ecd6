// TEMPORARY verification harness for BRIEF_HOLE_BY_HOLE_COLOUR. Delete after use.
import React, { useState } from 'react';
import { HoleRampLegend, HoleRowV2, buildHoleScale } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { A, Panel } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

function mk(hole_no: number, i: number): CourseHole {
  const profiles = [
    { birdie: 18, par: 46, bogey: 26, double: 10, avg: -0.1 },
    { birdie: 2, par: 20, bogey: 38, double: 40, avg: 1.3 },
    { birdie: 0, par: 40, bogey: 45, double: 15, avg: 0.7 },
    { birdie: 9, par: 55, bogey: 30, double: 6, avg: 0.3 },
  ];
  const p = profiles[i % 4];
  return {
    hole_no,
    par: 4,
    yards: 380,
    stroke_index: hole_no,
    rounds: 60,
    avg_to_par: p.avg + hole_no * 0.02,
    avg_gross: 4 + p.avg,
    dist: { ace: 0, albatross: 0, eagle: 0, birdie: p.birdie, par: p.par, bogey: p.bogey, double: p.double },
  } as unknown as CourseHole;
}

export default function HoleColourHarness() {
  const holes = Array.from({ length: 18 }, (_, i) => mk(i + 1, i));
  const [open, setOpen] = useState<Set<number>>(new Set([1, 2]));
  const graded = buildHoleScale(holes, new Map(), 640);
  const ungraded = buildHoleScale(holes, new Map(), 1);
  const toggle = (n: number) =>
    setOpen((prev) => {
      const s = new Set(prev);
      s.has(n) ? s.delete(n) : s.add(n);
      return s;
    });
  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Panel kicker="GRADED (640 ROUNDS) - ALL 18">
        <HoleRampLegend />
        {holes.map((h, i, arr) => (
          <HoleRowV2 key={h.hole_no} row={h} scale={graded} totalHoles={18} open={open.has(h.hole_no)} onToggle={() => toggle(h.hole_no)} last={i === arr.length - 1} />
        ))}
      </Panel>
      <Panel kicker="ONE ROUND - UNGRADED DIFFICULTY">
        <HoleRampLegend />
        {holes.slice(0, 4).map((h, i, arr) => (
          <HoleRowV2 key={h.hole_no} row={h} scale={ungraded} totalHoles={18} open={i === 0} onToggle={() => {}} last={i === arr.length - 1} />
        ))}
      </Panel>
    </div>
  );
}
