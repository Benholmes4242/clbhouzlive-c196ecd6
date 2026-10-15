import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ACTIVITY = [
  { course_id: 'a', is_top100: true, last_played_at: '2026-06-01', rating_value: 9.1, has_rating: true },
  { course_id: 'b', is_top100: false, last_played_at: '2026-03-01', rating_value: null, has_rating: false },
  { course_id: 'c', is_top100: false, last_played_at: '2025-08-01', rating_value: 7.2, has_rating: true },
  { course_id: 'd', is_top100: false, last_played_at: '2024-05-01', rating_value: 6.0, has_rating: true },
];
const COURSES = [
  { id: 'a', name: 'Alpha Links', country: 'Britain & Ireland', sub_country: 'Scotland', thumbnail_image: null, global_rank: 37 },
  { id: 'b', name: 'Bravo Park', country: 'Britain & Ireland', sub_country: 'England', thumbnail_image: null, global_rank: null },
  { id: 'c', name: 'Charlie Heath', country: 'USA', sub_country: 'Ohio', thumbnail_image: null, global_rank: null },
  { id: 'd', name: 'Delta Dunes', country: 'USA', sub_country: 'Texas', thumbnail_image: null, global_rank: null },
];

vi.mock('@/hooks/useUserCourseActivity', () => ({ useUserCourseActivity: () => ({ data: ACTIVITY }) }));
vi.mock('@/hooks/usePlayedUnratedCourses', () => ({ usePlayedUnratedCourses: () => ({ courses: [], count: 0 }) }));
const RANKS = [{ course_id: 'a', rank: 37, top100_lists: { slug: 'global', short_label: 'Global', name: 'World', is_active: true, sort_order: 0 } }];
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        in: () => {
          const p: any = Promise.resolve({ data: table === 'course_top100_memberships' ? RANKS : COURSES, error: null });
          p.eq = () => Promise.resolve({ data: RANKS, error: null });
          return p;
        },
      }),
    }),
  },
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
// The sort dropdown is a Radix portal; replace the bar with plain buttons that
// still print the two chip counts it receives.
vi.mock('@/components/profile/courses/FilterBar', () => ({
  FilterBar: (p: any) => (
    <div>
      <span data-testid="chip-all">{p.allCount}</span>
      <span data-testid="chip-top100">{p.top100Count}</span>
      <span data-testid="sort">{p.activeSort}</span>
      {['recently-played', 'rating-high-low', 'rating-low-high'].map((s) => (
        <button key={s} onClick={() => p.onSortChange(s)}>{`sort:${s}`}</button>
      ))}
    </div>
  ),
}));

import { AllCoursesList, DEFAULT_COURSE_SORT } from '@/components/profile/courses/AllCoursesList';

const mount = (own = true) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AllCoursesList userId="u1" isOwnProfile={own} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const rows = (c: HTMLElement) => c.querySelectorAll('article');
const SORTS = ['recently-played', 'rating-high-low', 'rating-low-high'] as const;

describe('profile courses archive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to the recency sort', async () => {
    expect(DEFAULT_COURSE_SORT).toBe('recently-played');
    mount();
    await waitFor(() => expect(document.querySelectorAll('article').length).toBeGreaterThan(0));
    expect(screen.getByTestId('sort').textContent).toBe('recently-played');
  });

  it('prints no sort-index number on any row, and keeps the stored #global_rank', async () => {
    const { container } = mount();
    await waitFor(() => expect(document.querySelectorAll('article').length).toBeGreaterThan(0));
    for (const s of SORTS) {
      fireEvent.click(screen.getByText(`sort:${s}`));
      rows(container).forEach((r) => {
        const leaves = [...r.querySelectorAll('span,div')].filter((n) => n.children.length === 0);
        expect(leaves.some((n) => /^\d+$/.test((n.textContent ?? '').trim()))).toBe(false);
      });
    }
    expect(await screen.findByText(/Global #37/)).toBeTruthy();
  });

  it('shows one year divider per year on the recency sort and none on the rating sorts', async () => {
    const { container } = mount();
    await waitFor(() => expect(document.querySelectorAll('article').length).toBeGreaterThan(0));
    const years = [...container.querySelectorAll('[data-year-divider]')].map((d) => d.getAttribute('data-year-divider'));
    expect(years).toEqual(['2026', '2025', '2024']);
    for (const s of ['rating-high-low', 'rating-low-high']) {
      fireEvent.click(screen.getByText(`sort:${s}`));
      expect(container.querySelectorAll('[data-year-divider]').length).toBe(0);
    }
  });

  it('the chip count and the rows drawn agree under each sort', async () => {
    const { container } = mount();
    await waitFor(() => expect(document.querySelectorAll('article').length).toBeGreaterThan(0));
    const expected = { 'recently-played': 4, 'rating-high-low': 4, 'rating-low-high': 4 };
    for (const s of SORTS) {
      fireEvent.click(screen.getByText(`sort:${s}`));
      await waitFor(() => expect(rows(container).length).toBe(expected[s]));
      expect(Number(screen.getByTestId('chip-all').textContent)).toBe(expected[s]);
    }
  });
});

describe('profile courses archive — mock design', () => {
  it('the sort control is exactly three chips, recency selected first, no rank or country sort', async () => {
    const { FilterBar } = await vi.importActual<any>('@/components/profile/courses/FilterBar');
    render(
      <FilterBar activeTab="all" onTabChange={() => {}} activeSort={DEFAULT_COURSE_SORT} onSortChange={() => {}}
        activeCountry="global" onCountryChange={() => {}} allCount={4} top100Count={1} />,
    );
    const chips = within(screen.getByRole('tablist', { name: 'Sort courses' })).getAllByRole('tab');
    expect(chips.map((c) => c.textContent)).toEqual(['Recent', 'Highest rated', 'Lowest rated']);
    expect(chips[0].getAttribute('aria-selected')).toBe('true');
    expect(chips.filter((c) => c.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(screen.queryByText(/rank/i)).toBeNull();
    expect(screen.queryByText(/^country$/i)).toBeNull();
  });

  it('a Top 100 row folds its rank into the first meta line', async () => {
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-testid="meta-line-1"]')?.textContent).toBeTruthy());
    const row = Array.from(rows(container)).find((r) => r.textContent?.includes('Alpha Links'))!;
    await waitFor(() => expect(within(row).getByTestId('meta-line-1').textContent).toContain('Global #37'));
    expect(screen.queryByTestId('rank-chip')).toBeNull();
    const scoreCol = Array.from(row.querySelectorAll<HTMLElement>('div')).find((d) => d.style.flex === '0 0 46px')!;
    expect(scoreCol.textContent).toBe('9.1');
  });

  it('no row draws a bar for the four category scores, collapsed or expanded', async () => {
    const { container } = mount();
    await waitFor(() => expect(rows(container).length).toBeGreaterThan(0));
    const noBars = () => expect([...container.querySelectorAll<HTMLElement>('article div')].some((d) => d.style.height === '8px' || d.style.height === '4px')).toBe(false);
    noBars();
    rows(container).forEach((r) => fireEvent.click(r));
    noBars();
  });
  it('the region row is five text-only options with no flag or globe', async () => {
    const { CourseRegionPills } = await vi.importActual<any>('@/components/leaderboard/courses/CourseRegionPills');
    render(<CourseRegionPills value="global" onChange={() => {}} appearance="archive" />);
    const group = screen.getByRole('group', { name: 'Course region' });
    const options = within(group).getAllByRole('button');
    expect(options.map((o) => o.textContent)).toEqual(['Global', 'GB&I', 'USA', 'Europe', 'Rest of World']);
    expect(group.querySelector('img, svg, [aria-hidden="true"]')).toBeNull();
    expect(group.textContent).not.toMatch(/[🌍🌏🌎]/u);
  });

  it('an expanded own-profile row with a review has three actions; another member gets two', async () => {
    const DossierCard = (await import('@/components/profile/courses/DossierCard')).default;
    const course: any = {
      id: 'x', name: 'Xray', country: 'England', sub_country: null, thumbnail_image: null, is_top100: false, global_rank: null,
      last_played_at: '2026-01-01', rating_value: 8, rating_id: 'r1', design_score: 8, condition_score: null,
      clubhouse_score: null, facilities_score: null, review: 'Lovely', review_date: '2026-01-02',
    };
    const actionsFor = (onEditReview?: (id: string) => void) => {
      const { container, unmount } = render(
        <DossierCard appearance="archive" course={course} onCourseClick={() => {}} onFullReview={() => {}} onEditReview={onEditReview} />,
      );
      fireEvent.click(container.querySelector('article')!);
      const grid = within(container).getByTestId('row-actions');
      const n = grid.querySelectorAll('button').length;
      const cols = grid.style.gridTemplateColumns;
      unmount();
      return { n, cols };
    };
    expect(actionsFor(() => {})).toEqual({ n: 3, cols: 'repeat(3, minmax(0, 1fr))' });
    expect(actionsFor(undefined)).toEqual({ n: 2, cols: 'repeat(2, minmax(0, 1fr))' });
  });
});
