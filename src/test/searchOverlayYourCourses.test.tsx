import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let myCourses: { course_id: string; course_name: string; rounds_count: number }[] = [];

vi.mock('@/features/search-v2/hooks/useSearchEmptyStateV2', () => ({
  useSearchEmptyStateV2: () => ({
    data: { event: null, players: [], suggested_people: [], popular_courses: [{ id: 'p1', name: 'Top Course', avg_rating: 9.9 }] },
    isLoading: false, isError: false, refetch: vi.fn(),
  }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({
  useUserAnalyticsCourses: () => ({ data: myCourses }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet', () => ({ default: () => null }));

import { SearchEmptyState } from '@/features/search-v2/components/SearchEmptyState';

const renderIt = () => render(<MemoryRouter><SearchEmptyState onSelect={() => {}} /></MemoryRouter>);

describe('BRIEF_SEARCH_OVERLAY zero state', () => {
  beforeEach(() => { myCourses = []; });

  it('J.1 heads the rating-ordered list "Highest rated on clbhouz"', () => {
    renderIt();
    expect(screen.getByText('Highest rated on clbhouz')).toBeTruthy();
    expect(screen.queryByText('Popular on clbhouz')).toBeNull();
  });

  it('J.5 a member with no rounds sees no "Your courses" heading', () => {
    renderIt();
    expect(screen.queryByText('Your courses')).toBeNull();
  });

  it('J.5 a member with rounds sees their courses in gam_user_courses order', () => {
    myCourses = [
      { course_id: 'east', course_name: 'Sundridge Park East', rounds_count: 111 },
      { course_id: 'west', course_name: 'Sundridge Park West', rounds_count: 76 },
    ];
    renderIt();
    expect(screen.getByText('Your courses')).toBeTruthy();
    expect(screen.getByText('See all')).toBeTruthy();
    const names = screen.getAllByText(/Sundridge Park (East|West)/).map(n => n.textContent);
    expect(names).toEqual(['Sundridge Park East', 'Sundridge Park West']);
  });
});
