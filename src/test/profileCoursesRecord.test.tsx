import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Geographies: () => null, Geography: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
}));

import { JourneySummaryCard } from '@/components/profile/courses/JourneySummaryCard';
import { CoursesMapSection } from '@/components/profile/courses/CoursesMapSection';
import { summariseCountries } from '@/hooks/useUserCourseSummary';
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

  it('Top 100 tile and filter chip take one lifted count', () => {
    render(<JourneySummaryCard {...base} coursesPlayed={53} countriesPlayed={9} top100Played={17} />);
    expect(screen.getByTestId('tile-TOP 100 PLAYED').textContent).toBe('17');
    const tab = readFileSync(join(__dirname, '../components/profile/ProfileCoursesTab.tsx'), 'utf8');
    expect(tab).toContain('top100Played={top100Count}');
    expect(tab).toContain('top100Count={top100Count ?? undefined}');
    const list = readFileSync(join(__dirname, '../components/profile/courses/AllCoursesList.tsx'), 'utf8');
    expect(list).toContain('top100: top100Count ??');
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
