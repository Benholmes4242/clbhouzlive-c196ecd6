import { describe, it, vi, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import React from 'react';

const EN = JSON.parse(fs.readFileSync('public/locales/en/courses.json', 'utf8'));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const path = k.replace(/^courses:/, '').split('.');
      let node: unknown = EN;
      for (const seg of path) node = (node as Record<string, unknown>)?.[seg];
      let s = typeof node === 'string' ? node : undefined;
      if (!s) {
        const c = Number(o?.count);
        const plural = (node as Record<string, string>) ?? {};
        s =
          typeof plural === 'object'
            ? (c === 1 ? plural['one'] : plural['other']) ?? undefined
            : undefined;
      }
      if (!s) return `RAWKEY:${k}`;
      return s.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n] ?? `RAWVAR:${n}`));
    },
  }),
}));

vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({
  useCourseHoleAnalysis: () => ({ data: { available: false, holes: [] } }),
}));

// thirds: 2.4 / 2.7 / 3.4 -> spread 1.0, worst = last six (Ben's card)
// even card: 2.4 / 2.5 / 2.7 -> spread 0.3
let mode: 'ben' | 'even' = 'ben';
const build = () => {
  const per = mode === 'ben' ? [2.4, 2.7, 3.4] : [2.4, 2.5, 2.7];
  const holes = Array.from({ length: 18 }, (_, i) => {
    const third = i < 6 ? 0 : i < 12 ? 1 : 2;
    const doubles = [18, 15, 7, 5].includes(i + 1) ? [23, 19, 14, 12][[18, 15, 7, 5].indexOf(i + 1)] : 6;
    return {
      hole_no: i + 1,
      par: 4,
      shots_over_par: per[third] / 6,
      avg_score: 4 + per[third] / 6,
      rounds_played: 34,
      par_or_better: 9,
      bogeys: 12,
      doubles_plus: doubles,
    };
  });
  return {
    rounds: 34,
    total_over_par: per.reduce((a, b) => a + b, 0),
    avg_gross: 80.5,
    holes,
  };
};

vi.mock('@/features/courses/components/holes/useCourseScoringBreakdown', () => ({
  useCourseScoringBreakdown: () => ({ isLoading: false, data: build() }),
}));

describe('thirds floor + doubles bars', () => {
  it('renders both states', async () => {
    const { ScoringBreakdownSection } = await import(
      '@/features/courses/components/holes/ScoringBreakdownSection'
    );
    const out: string[] = [];
    for (const m of ['ben', 'even'] as const) {
      mode = m;
      out.push(
        renderToStaticMarkup(
          React.createElement(
            'div',
            { style: { width: 390, background: '#F8FAFC', padding: 12 } },
            React.createElement(ScoringBreakdownSection, { golfCourseId: 'c' }),
          ),
        ),
      );
    }
    fs.writeFileSync(
      '/tmp/browser/thirds/out.html',
      `<html><body style="margin:0;font-family:-apple-system,system-ui">${out.join('<hr>')}</body></html>`,
    );
    expect(out.join()).not.toContain('RAWKEY');
    expect(out.join()).not.toContain('RAWVAR');
    expect(out[0]).toContain('You fade late');
    expect(out[0]).toContain('1.0 shots more');
    expect(out[1]).toContain('You score evenly');
  });
});
