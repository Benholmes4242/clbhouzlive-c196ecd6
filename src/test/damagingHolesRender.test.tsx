import { describe, it, vi, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import React from 'react';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const short = k.split('.').pop() ?? k;
      const map: Record<string, string> = {
        damagingHoles: 'Your most damaging holes',
        byShotsLost: 'Ranked by shots lost, not by difficulty',
        colHole: 'Hole',
        s1Sub: 'Par / your average',
        colCostARound: 'Cost a round',
        parYouAvg: `Par ${o?.par} · you average ${o?.avg}`,
        vsFieldLegend: 'Field here',
        vsBetter: 'Better than the field here',
        vsWorse: 'Worse than the field here',
        vsLevel: 'Level with the field',
        moreRoundsHint: 'More rounds needed',
      };
      return map[short] ?? short;
    },
  }),
}));

// hole 18: member much worse (red). hole 7: member much better (green).
// hole 5: inside the floor (level). hole 12: field has no reading (unchanged).
const field = [
  { hole_no: 18, par: 4, avg_to_par: 1.21, yards: 400, rounds: 900 },
  { hole_no: 7, par: 4, avg_to_par: 2.4, yards: 400, rounds: 900 },
  { hole_no: 5, par: 4, avg_to_par: 1.1, yards: 400, rounds: 900 },
  { hole_no: 3, par: 3, avg_to_par: 0.7, yards: 160, rounds: 900 },
];

vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({
  useCourseHoleAnalysis: () => ({ data: { available: true, holes: field, total_rounds: 900 } }),
}));

const mine = [
  { hole_no: 18, shots_over_par: 2.15, avg_score: 6.15, par: 4 },
  { hole_no: 7, shots_over_par: 1.4, avg_score: 5.4, par: 4 },
  { hole_no: 12, shots_over_par: 1.2, avg_score: 5.2, par: 4 },
  { hole_no: 5, shots_over_par: 1.0, avg_score: 5.0, par: 4 },
  { hole_no: 3, shots_over_par: 0.8, avg_score: 3.8, par: 3 },
];

vi.mock('@/features/courses/components/holes/useCourseScoringBreakdown', () => ({
  useCourseScoringBreakdown: () => ({
    isLoading: false,
    data: {
      rounds: 21,
      total_over_par: 12.4,
      avg_gross: 84.4,
      holes: mine.map((h) => ({
        ...h,
        rounds_played: 21,
        par_or_better: 4,
        bogeys: 8,
        doubles_plus: 9,
      })),
    },
  }),
}));

describe('damaging holes vs field', () => {
  it('renders four states', async () => {
    const { ScoringBreakdownSection } = await import(
      '@/features/courses/components/holes/ScoringBreakdownSection'
    );
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { style: { width: 390, background: '#F8FAFC', padding: 12 } },
        React.createElement(ScoringBreakdownSection, { golfCourseId: 'c' }),
      ),
    );
    fs.writeFileSync(
      '/tmp/browser/damaging/out.html',
      `<html><body style="margin:0;font-family:-apple-system,system-ui">${html}</body></html>`,
    );
    expect(html).toContain('Worse than the field here');
    expect(html).toContain('Better than the field here');
    expect(html).toContain('Level with the field');
    expect(html).toContain('Field here');
  });
});
