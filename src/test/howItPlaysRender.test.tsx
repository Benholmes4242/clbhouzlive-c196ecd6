/**
 * TEMPORARY visual harness (BRIEF_HOW_IT_PLAYS_GRADED). Renders the How it
 * plays panel in both data states and writes the markup to /tmp for a
 * Playwright screenshot. Delete after the brief is verified.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, vi } from 'vitest';
import fs from 'node:fs';

const HOLES = [
  0.9, 0.35, 1.05, 0.2, 0.62, -0.12, 0.48, 0.88, 0.3, 0.7, 0.42, 1.2, 0.15, 0.55, 0.95, 0.25,
  0.68, 1.35,
].map((v, i) => ({
  hole_no: i + 1,
  par: 4,
  yards: 400,
  stroke_index: i + 1,
  rounds: 40,
  avg_to_par: v,
  avg_gross: 4 + v,
  dist: { ace: 0, albatross: 0, eagle: 0, birdie: 5, par: 30, bogey: 40, double: 25 },
}));

const MINE = HOLES.map((h) => ({
  hole_no: h.hole_no,
  rounds: 6,
  avg_to_par: h.avg_to_par - 0.35 + (h.hole_no % 4 === 0 ? 0.6 : 0),
  avg_gross: 0,
  best_gross: 0,
}));

let withPersonal = false;

vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({
  useCourseHoleAnalysis: () => ({
    data: { available: true, total_rounds: 146, holes: HOLES },
  }),
}));
vi.mock('@/hooks/gam/useMyHolePerformance', () => ({
  useMyHolePerformance: () => ({ data: withPersonal ? MINE : [] }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'u1' } }),
}));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: { id: 'c1' } }) }));
vi.mock('@/i18n/format', () => ({ formatNumber: (n: number) => String(n) }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'courses:courseDetail.blocks.howItPlays': 'HOW IT PLAYS',
        'courses:courseDetail.plays.fieldAvg': 'Field avg',
        'courses:courseDetail.plays.yourAvg': 'Your avg',
        'courses:courseDetail.plays.youBeat': 'You beat field on',
        'courses:courseDetail.plays.hardestHole': 'Hardest hole',
        'courses:courseDetail.plays.easiestHole': 'Easiest hole',
        'courses:courseDetail.plays.legendEasier': 'Easier',
        'courses:courseDetail.plays.legendHarder': 'Harder',
        'courses:courseDetail.plays.legendYou': 'You',
        'courses:courseDetail.plays.rounds': `${o?.rounds ?? ''} rounds`,
        'courses:courseDetail.plays.holeN': `Hole ${o?.hole ?? ''}`,
      };
      return map[k] ?? k;
    },
  }),
}));

describe('how it plays harness', () => {
  it('writes both states', async () => {
    const { CourseAnalyticsPanels } = await import(
      '@/features/courses/components/holes/analytical/CourseAnalyticsPanels'
    );
    const shell = (html: string, title: string) =>
      `<div style="width:390px;background:#F4F6F9;padding:8px 0"><div style="font:600 11px system-ui;padding:4px 16px;color:#68707B">${title}</div>${html}</div>`;
    withPersonal = false;
    const a = renderToStaticMarkup(<CourseAnalyticsPanels courseId="c" />);
    withPersonal = true;
    const b = renderToStaticMarkup(<CourseAnalyticsPanels courseId="c" />);
    fs.writeFileSync(
      '/tmp/browser/hip/harness.html',
      `<!doctype html><meta charset="utf-8"><body style="margin:0;font-family:-apple-system,system-ui">${shell(a, 'NO PERSONAL DATA')}${shell(b, 'WITH PERSONAL DATA')}</body>`,
    );
  });
});
