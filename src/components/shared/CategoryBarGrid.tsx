/**
 * CATEGORY BARS 2×2 (signed-off mock category-bars-2x2-signed-off.html) — the
 * ONE shared category breakdown: word and score above a 6px white bar filled
 * to the average on a 0–10 scale, in a 2×2 grid. Replaces the range bands on
 * the Course tab (WhatPeopleSay), the Reviews tab (FewReviews, WhatTheyScored)
 * and the business profile's "What golfers say" (ClubWhatGolfersSay).
 *
 * ALL WHITE: the fill is the same A.INK as the figure — no green, no grey and
 * no score-tone or fill-percent helper anywhere in this component. Null values
 * are left out; when nothing is left, nothing renders. The
 * four known categories always print design, condition, clubhouse, facilities
 * whatever order they arrive in; any other key follows in arrival order.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';

export interface CategoryBarItem {
  key: string;
  label: string;
  value: number | null;
}

const ORDER = ['design', 'condition', 'clubhouse', 'facilities'];

export const CategoryBarGrid: React.FC<{ items: readonly CategoryBarItem[] }> = ({ items }) => {
  const present = items.filter((item) => item.value != null);
  if (present.length === 0) return null;
  // Stable sort: the four known categories first in the fixed order, extras after in arrival order.
  const ordered = [...present].sort((a, b) => {
    const ia = ORDER.indexOf(a.key);
    const ib = ORDER.indexOf(b.key);
    return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib);
  });
  return (
    <div
      data-category-bar-grid
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 22, rowGap: 20, fontFamily: SANS }}
    >
      {ordered.map((item) => {
        const value = item.value as number;
        return (
          <div key={item.key} data-category-bar={item.key} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: A.MUTE, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <span data-category-figure style={{ fontSize: 15, fontWeight: 700, color: A.INK, flexShrink: 0, ...FIGS }}>
                {value.toFixed(1)}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: A.TRACK, marginTop: 9, overflow: 'hidden' }}>
              <div data-category-fill style={{ height: '100%', borderRadius: 4, background: A.INK, width: `${Math.max(0, Math.min(10, value)) * 10}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryBarGrid;
