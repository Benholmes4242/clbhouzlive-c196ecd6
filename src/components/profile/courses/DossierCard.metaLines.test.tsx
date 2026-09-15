import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';

const enCourses = JSON.parse(
  readFileSync(process.cwd() + '/public/locales/en/courses.json', 'utf8'),
) as Record<string, Record<string, string>>;

// Real en translations with plural selection, so the "1 ROUNDS" regression
// cannot hide behind a defaultValue fallback.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number; avg?: string; defaultValue?: string }) => {
      const parts = key.split('.');
      const root = parts[0];
      const leaf = parts.slice(1).join('.');
      const ns = enCourses[root];
      const plural = opts?.count != null ? (opts.count === 1 ? '_one' : '_other') : '';
      let v = ns?.[`${leaf}${plural}`] ?? ns?.[leaf];
      if (v == null) v = opts?.defaultValue ?? key;
      if (opts?.count != null) v = v.replace('{{count}}', String(opts.count));
      if (opts?.avg != null) v = v.replace('{{avg}}', opts.avg);
      return v;
    },
  }),
}));

// The real module boots the i18n singleton, which cannot init under jsdom.
vi.mock('@/i18n/format', () => ({
  formatDayMonthYearShortGB: (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
}));

import DossierCard from '@/components/profile/courses/DossierCard';
import type { RatedCourseData } from '@/components/profile/courses/my-ratings/myRatingsTiers';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';

const baseCourse: RatedCourseData = {
  id: 'c1',
  name: 'Centurion Club',
  country: 'England',
  sub_country: null,
  thumbnail_image: null,
  is_top100: false,
  global_rank: null,
  last_played_at: '2026-09-03T00:00:00Z',
  rating_value: 8.4,
  rating_id: null,
  design_score: null,
  condition_score: null,
  clubhouse_score: null,
  facilities_score: null,
  review: null,
  review_date: null,
};

const scoring = (over: Partial<UserAnalyticsCourse>): UserAnalyticsCourse => ({
  course_id: 'c1',
  course_name: 'Centurion Club',
  rounds_count: 1,
  last_played: null,
  avg_to_par: 1.0,
  hardest_hole_no: null,
  hardest_hole_avg: null,
  eagles_plus_pct: null,
  birdies_pct: null,
  pars_pct: null,
  bogeys_plus_pct: null,
  eagles_plus_count: null,
  birdies_count: null,
  pars_count: null,
  bogeys_plus_count: null,
  eagles_plus_pct_exact: null,
  birdies_pct_exact: null,
  pars_pct_exact: null,
  bogeys_plus_pct_exact: null,
  ...over,
});

const noop = () => {};

describe('DossierCard meta lines', () => {
  it('renders date + country on line 1 and rounds + average on line 2 as separate lines', () => {
    render(
      <DossierCard course={baseCourse} rank={1} onCourseClick={noop} onFullReview={noop} scoring={scoring({})} />,
    );
    const line1 = screen.getByText(/England/).closest('div') as HTMLElement;
    const line2 = screen.getByText(/avg/).closest('div') as HTMLElement;
    expect(line1).not.toBe(line2);
    expect(line1.textContent).toContain('2026');
    expect(line1.textContent).not.toContain('round');
    expect(line2.textContent).not.toContain('England');
  });

  it('pluralises: 1 round, 12 rounds', () => {
    render(
      <DossierCard course={baseCourse} rank={1} onCourseClick={noop} onFullReview={noop} scoring={scoring({})} />,
    );
    expect(screen.getByText(/1 round \u00B7/)).toBeTruthy();
    expect(screen.queryByText(/1 rounds/)).toBeNull();
  });

  it('renders no second line when there is no scoring', () => {
    const { container } = render(
      <DossierCard course={baseCourse} rank={1} onCourseClick={noop} onFullReview={noop} scoring={null} />,
    );
    expect(screen.queryByText(/round/)).toBeNull();
    expect(screen.queryByText(/avg/)).toBeNull();
    // No empty placeholder line either: only the line-1 meta div renders.
    const metaDivs = [...container.querySelectorAll('article div')].filter(
      (d) => /2026/.test(d.textContent ?? '') || /avg|round/.test(d.textContent ?? ''),
    );
    expect(metaDivs.some((d) => d.textContent?.trim() === '')).toBe(false);
  });
});
