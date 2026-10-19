/**
 * CRM1.5 — the ONE copy of the category band rows: label, a track carrying a
 * low-to-high range fill with a mean mark, and the right-hand mean figure with
 * its low–high range beneath. Extracted UNCHANGED from FewReviews so the Course
 * tab (WhatPeopleSay) and the Reviews tab (FewReviews) render the same rows.
 *
 * NOT under reviews/: reviewsState2.test.tsx sweeps that whole directory and
 * forbids the middle-80 band statistic anywhere in it. The bands stay min-max
 * at every count (CRM1.10); subScoreBandStatistic is never wired here.
 *
 * Geometry is the shipped one — 82px / minmax(0,1fr) / 72px grid, 9px track,
 * 8px 0 row padding, courseSubScoreTone on the mean mark and mean figure.
 * The mock's 76px label and 6px track are mock drift and were not copied.
 */
import React from 'react';
import { SURFACE } from '@/lib/tokens/surface';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { FIGS, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

export interface CategoryBand {
  key: string;
  label: string;
  mean: number;
  low: number;
  high: number;
}

export const CategoryBands: React.FC<{ bands: readonly CategoryBand[] }> = ({ bands }) => (
  <div style={{ marginTop: 16 }}>
    {bands.map(band => <div key={band.key} data-category-band={band.key} data-low={band.low} data-high={band.high} data-mean={band.mean} style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr) 72px', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <span style={{ color: SURFACE.dark.body, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45 }}>{band.label}</span>
      <div style={{ height: 9, borderRadius: 5, background: inkWithAlpha(SURFACE.dark.ink, 0.05), position: 'relative' }}>
        <div data-range style={{ position: 'absolute', top: 0, bottom: 0, left: `${band.low * 10}%`, width: `${(band.high - band.low) * 10}%`, background: inkWithAlpha(SURFACE.dark.ink, 0.22), borderRadius: 5 }} />
        <div data-mean-mark style={{ position: 'absolute', top: -2, bottom: -2, width: 3, borderRadius: 2, left: `calc(${band.mean * 10}% - 1.5px)`, background: courseSubScoreTone(band.mean) }} />
      </div>
      <span style={{ color: courseSubScoreTone(band.mean), fontSize: 13, fontWeight: 800, textAlign: 'right', ...FIGS }}>{band.mean.toFixed(1)}<span style={{ display: 'block', color: SURFACE.dark.dim, fontSize: 9.5, marginTop: 1 }}>{band.low.toFixed(1)}–{band.high.toFixed(1)}</span></span>
    </div>)}
  </div>
);

export default CategoryBands;
