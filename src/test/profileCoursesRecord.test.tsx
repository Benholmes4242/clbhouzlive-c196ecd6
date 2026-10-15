import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ACTIVITY = [
  { course_id: 'a', is_top100: true, last_played_at: '2026-06-01', rating_value: 9.1, has_rating: true },
  { course_id: 'b', is_top100: true, last_played_at: '2026-03-01', rating_value: null, has_rating: false },
  { course_id: 'c', is_top100: false, last_played_at: '2025-08-01', rating_value: 7.2, has_rating: true },
  { course_id: 'd', is_top100: false, last_played_at: '2024-05-01', rating_value: null, has_rating: false },
];
const COURSES = ['a', 'b', 'c', 'd'].map((id) => ({
  id, name: `Course ${id}`, country: 'USA', sub_country: 'Ohio', thumbnail_image: null, global_rank: id === 'a' || id === 'b' ? 5 : null,
}));
vi.mock('@/hooks/useUserCourseActivity', () => ({ useUserCourseActivity: () => ({ data: ACTIVITY }) }));
vi.mock('@/hooks/usePlayedUnratedCourses', () => ({ usePlayedUnratedCourses: () => ({ courses: [], count: 0 }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/profile/courses/FilterBar', () => ({
  FilterBar: (p: any) => (
    <div>
      <span data-testid="chip-all">{p.allCount}</span>
      <span data-testid="chip-top100">{p.top100Count}</span>
      <button onClick={() => p.onTabChange('top100')}>tab:top100</button>
      <button onClick={() => p.onCountryChange('global')}>country:global</button>
      {['recently-played', 'rating-high-low', 'rating-low-high'].map((s) => (
        <button key={s} onClick={() => p.onSortChange(s)}>{`sort:${s}`}</button>
      ))}
    </div>
  ),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: COURSES, error: null }) }) }) },
}));
vi.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Geographies: () => null, Geography: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
}));

import { JourneySummaryCard } from '@/components/profile/courses/JourneySummaryCard';
import { CoursesMapSection } from '@/components/profile/courses/CoursesMapSection';
import { summariseCountries } from '@/hooks/useUserCourseSummary';
import { AllCoursesList } from '@/components/profile/courses/AllCoursesList';
import { top100Standing } from '@/components/profile/handicap/whs/gam/trophy-room/career/shareModel';

const base = { avgRating: 8.2, ratedCount: 35, top100Played: 12, isOwnProfile: true };

describe('profile courses record', () => {
  it('hero renders the played figure and the country count', () => {
    render(<JourneySummaryCard {...base} coursesPlayed={53} countriesPlayed={9} />);
    expect(screen.getByTestId('record-played').textContent).toBe('53');
    expect(screen.getByTestId('record-countries').textContent).toBe('9');
  });

  it('a null played figure renders its label with no figure, never a zero', () => {
    render(<JourneySummaryCard {...base} coursesPlayed={null} countriesPlayed={null} />);
    expect(screen.getByText('courses played')).toBeTruthy();
    expect(screen.getByTestId('record-played').textContent).toBe('');
  });

  it("standing kind 'none' renders nothing", () => {
    expect(top100Standing([], 'global', 2, 5, 10, 100)).toEqual({ kind: 'none' });
    render(<JourneySummaryCard {...base} coursesPlayed={53} countriesPlayed={9} standing={null} />);
    expect(screen.queryByTestId('record-standing')).toBeNull();
  });

  it('no played course is absent under any sort, and the chip equals the rows drawn', async () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AllCoursesList userId="u1" isOwnProfile />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelectorAll('article').length).toBe(4));
    for (const s of ['recently-played', 'rating-high-low', 'rating-low-high']) {
      fireEvent.click(screen.getByText(`sort:${s}`));
      await waitFor(() => expect(container.querySelectorAll('article').length).toBe(ACTIVITY.length));
      for (const c of COURSES) expect(screen.getAllByText(c.name).length).toBeGreaterThan(0);
      expect(Number(screen.getByTestId('chip-all').textContent)).toBe(container.querySelectorAll('article').length);
    }
    fireEvent.click(screen.getByText('tab:top100'));
    fireEvent.click(screen.getByText('country:global'));
    await waitFor(() => expect(container.querySelectorAll('article').length).toBe(2));
    expect(Number(screen.getByTestId('chip-top100').textContent)).toBe(2);
  });

  it('countries come from sub_country and a null sub_country is not counted', () => {
    const r = summariseCountries([
      { id: 'a', sub_country: 'England' }, { id: 'b', sub_country: 'England' },
      { id: 'c', sub_country: 'Portugal' }, { id: 'd', sub_country: null }, { id: 'e', sub_country: '' },
    ]);
    expect(r.count).toBe(2);
    expect(r.tallies[0]).toEqual({ country: 'England', courses: 2 });
  });

  it('at most five tally rows, overflow line only when more exist', () => {
    const six = ['A', 'B', 'C', 'D', 'E', 'F'].map((c, i) => ({ country: c, courses: 6 - i }));
    const { unmount } = render(<CoursesMapSection tallies={six} points={[]} />);
    expect(screen.getAllByTestId('country-row')).toHaveLength(5);
    expect(screen.getByTestId('country-further').textContent).toBe('+1 further afield');
    unmount();
    render(<CoursesMapSection tallies={six.slice(0, 5)} points={[]} />);
    expect(screen.queryByTestId('country-further')).toBeNull();
  });
});
