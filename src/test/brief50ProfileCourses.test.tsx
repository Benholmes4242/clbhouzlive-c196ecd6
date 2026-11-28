import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Brief 50 Part G: ticked-only courses on the profile Courses tab.
const ACTIVITY = [
  { course_id: 'a', is_top100: true, last_played_at: '2026-06-01', rating_value: 9.1, has_rating: true },
  { course_id: 't', is_top100: true, last_played_at: null, rating_value: null, has_rating: false, has_played: true },
  { course_id: 'c', is_top100: false, last_played_at: '2025-08-01', rating_value: 7.2, has_rating: true },
];
const COURSES = [
  { id: 't', name: 'Tick Links', country: 'Britain & Ireland', sub_country: 'Scotland', thumbnail_image: null, global_rank: 12 },
  { id: 'a', name: 'Alpha Links', country: 'Britain & Ireland', sub_country: 'Scotland', thumbnail_image: null, global_rank: 37 },
  { id: 'c', name: 'Charlie Heath', country: 'USA', sub_country: 'Ohio', thumbnail_image: null, global_rank: null },
];
const toggle = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/played/useSetCoursePlayed', () => ({ useSetCoursePlayed: () => ({ toggle, mutate: vi.fn(), isPending: false }) }));
vi.mock('@/hooks/useUserCourseActivity', () => ({ useUserCourseActivity: () => ({ data: ACTIVITY }) }));
vi.mock('@/hooks/useProTourCourses', () => ({ useProTourCourses: () => ({ data: new Map() }) }));
vi.mock('@/hooks/usePlayedUnratedCourses', () => ({ usePlayedUnratedCourses: () => ({ courses: [], count: 0 }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        in: () => {
          const p: any = Promise.resolve({ data: table === 'course_top100_memberships' ? [] : COURSES, error: null });
          p.eq = () => Promise.resolve({ data: [], error: null });
          return p;
        },
      }),
    }),
  },
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/profile/courses/FilterBar', () => ({
  FilterBar: (p: any) => (
    <div>
      <span data-testid="chip-all">{p.allCount}</span>
      <span data-testid="chip-top100">{p.top100Count}</span>
    </div>
  ),
}));

import { AllCoursesList, compareRecentlyPlayed, isTickedOnlyRow } from '@/components/profile/courses/AllCoursesList';
import { summariseCountries } from '@/hooks/useUserCourseSummary';

const mount = (own: boolean) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/p']}>
        <Routes>
          <Route path="/p" element={<AllCoursesList userId="u1" isOwnProfile={own} />} />
          <Route path="/courses/:id/rate" element={<div data-testid="rate-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const tickRow = async () => (await screen.findByText('Tick Links')).closest('article') as HTMLElement;

describe('Brief 50 G — ticked-only profile course rows', () => {
  beforeEach(() => toggle.mockClear());

  it('own profile: country only, own line 2, Review and Remove from played', async () => {
    mount(true);
    const row = await tickRow();
    expect(within(row).getByTestId('meta-line-1').textContent).toBe('Scotland');
    expect(row.textContent).not.toMatch(/Invalid date/);
    expect(within(row).getByTestId('meta-line-2').textContent).toBe('Played \u00B7 not rated yet');
    fireEvent.click(row);
    const actions = within(row).getByTestId('row-actions');
    expect(within(actions).getAllByRole('button')).toHaveLength(3);
    fireEvent.click(within(actions).getByRole('button', { name: 'Remove from played' }));
    expect(toggle).toHaveBeenCalledWith(expect.objectContaining({ via_tick: true, can_untick: true }), 't', 'Tick Links', 'profile_courses');
    fireEvent.click(within(actions).getByRole('button', { name: 'Review' }));
    expect(await screen.findByTestId('rate-page')).toBeInTheDocument();
  });

  it("other profile: line 2 reads Played, no Review, no Remove", async () => {
    mount(false);
    const row = await tickRow();
    expect(within(row).getByTestId('meta-line-2').textContent).toBe('Played');
    fireEvent.click(row);
    const actions = within(row).getByTestId('row-actions');
    expect(within(actions).queryByRole('button', { name: 'Review' })).toBeNull();
    expect(within(actions).queryByRole('button', { name: 'Remove from played' })).toBeNull();
  });

  it('rated rows keep no played line', async () => {
    mount(true);
    await tickRow();
    const alpha = [...document.querySelectorAll('article')].find((a) => a.textContent?.includes('Alpha Links')) as HTMLElement;
    expect(within(alpha).queryByTestId('meta-line-2')).toBeNull();
  });

  it('All and Top 100 counts include the ticked course', async () => {
    mount(true);
    await tickRow();
    expect(screen.getByTestId('chip-all').textContent).toBe('3');
    expect(screen.getByTestId('chip-top100').textContent).toBe('2');
  });

  it('date sort puts ticked-only rows after dated rows', async () => {
    const { container } = mount(true);
    await tickRow();
    const names = [...container.querySelectorAll('article')].map((a) => a.textContent ?? '');
    expect(names[names.length - 1]).toContain('Tick Links');
    const sorted = [{ last_played_at: null }, { last_played_at: '2025-01-01' }, { last_played_at: '2026-01-01' }].sort(compareRecentlyPlayed);
    expect(sorted.map((r) => r.last_played_at)).toEqual(['2026-01-01', '2025-01-01', null]);
  });

  it('a row with rounds is not ticked-only', () => {
    const base = { id: 'x', name: 'X', country: 'USA', sub_country: null, thumbnail_image: null, is_top100: false, last_played_at: null, rating_value: null, has_rating: false, rating_id: null };
    expect(isTickedOnlyRow(base, 0)).toBe(true);
    expect(isTickedOnlyRow(base, 3)).toBe(false);
    expect(isTickedOnlyRow({ ...base, has_rating: true, rating_value: 8 }, 0)).toBe(false);
  });

  it('map points include a ticked course with coordinates; one without counts unmapped', () => {
    const s = summariseCountries([
      { id: 't', name: 'Tick Links', sub_country: 'Scotland', latitude: 56.3, longitude: -2.8 } as any,
      { id: 'u', name: 'Tick Moor', sub_country: 'England', latitude: null, longitude: null, golf_clubs: null } as any,
    ]);
    expect(s.points.map((p) => p.id)).toEqual(['t']);
    expect(s.unmapped).toBe(1);
  });
});
