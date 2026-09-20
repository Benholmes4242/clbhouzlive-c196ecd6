/**
 * BRIEF_REVIEWS_TAB_REBUILD §3.2 — WHAT THEY SCORED. Kicker, no heading.
 *
 * The four AGGREGATE category scores also render on the Course tab. They show
 * from the first rating onward; only the overall tier word is sample-gated.
 * Category figures use the shared binary rule: green at 9+, muted otherwise.
 */
import React from 'react';
import { A, SANS, FIGS, BAR_RADIUS, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection } from '../about/AboutSection';

export interface CategoryAggregates {
  design?: number | null;
  condition?: number | null;
  facilities?: number | null;
  clubhouse?: number | null;
}

interface WhatTheyScoredProps {
  aggregates: CategoryAggregates;
}

const ORDER: { key: keyof CategoryAggregates; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'condition', label: 'Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
];

export const WhatTheyScored: React.FC<WhatTheyScoredProps> = ({ aggregates }) => {
  const rows = ORDER
    .map((r) => ({ label: r.label, value: aggregates[r.key] }))
    .filter((r) => r.value !== null && r.value !== undefined) as { label: string; value: number }[];

  if (rows.length === 0) return null;

  return (
    <AboutSection kicker="What they scored">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: SANS }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 78, flexShrink: 0, fontSize: 12, color: A.MUTE }}>{row.label}</span>
            <span style={{ flex: 1, minWidth: 0, height: 4, borderRadius: BAR_RADIUS, background: A.TRACK, overflow: 'hidden' }}>
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, (row.value / 10) * 100))}%`,
                   background: courseSubScoreTone(row.value),
                  borderRadius: BAR_RADIUS,
                }}
              />
            </span>
             <span style={{ width: 30, flexShrink: 0, textAlign: 'right', fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: courseSubScoreTone(row.value), ...FIGS }}>
              {row.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </AboutSection>
  );
};

export default WhatTheyScored;
