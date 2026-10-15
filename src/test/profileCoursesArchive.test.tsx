import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: COURSES, error: null }) }) }) },
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

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AllCoursesList userId="u1" isOwnProfile />
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
    expect(screen.getByText('#37')).toBeTruthy();
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
