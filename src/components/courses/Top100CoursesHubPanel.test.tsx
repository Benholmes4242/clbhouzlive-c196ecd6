/**
 * HUNDRED_FIT_1_R AYA3/4: the under-five gate lives in the panel, so the rule
 * is tested here against the panel — never in yourHundredPeek.test.tsx, which
 * mounts the section directly and is untouched. Absence is asserted by query
 * (heading, grid cells, legend returning null), never by computed style.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  courses: vi.fn(),
  enrichment: vi.fn(),
  progress: vi.fn(),
}));

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/hooks/useGolfCoursesInfinite', () => ({ useGolfCoursesInfinite: f.courses }));
vi.mock('@/hooks/top100/useTop100Enrichment', () => ({ useTop100Enrichment: f.enrichment }));
vi.mock('@/hooks/useTop100ProgressForUser', () => ({ useTop100ProgressForUser: f.progress }));
vi.mock('@/hooks/top100/useTop100GolferBaseline', () => ({ useTop100GolferBaseline: f.baseline }));
vi.mock('./browse/PageLoadGate', () => ({
  PageLoadGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePageRevealed: () => true,
  useSectionReady: () => {},
}));
vi.mock('./BrowseCourseCard', () => ({ default: () => null }));

import Top100CoursesHubPanel from './Top100CoursesHubPanel';

const COURSES = Array.from({ length: 6 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `Course ${i + 1}`,
  country: 'England',
  region: null,
  sub_country: null,
  thumbnail_image: null,
  global_rank: i + 1,
  regional_rank: null,
  list_memberships: [
    { list_slug: 'global', rank: i + 1 },
    { list_slug: 'gb-i', rank: i + 1 },
  ],
}));

function progressData(globalPlayed: number, gbiPlayed: number) {
  return {
    lists: [
      { listSlug: 'global', played: globalPlayed, rated: 0, total: 100 },
      { listSlug: 'gb-i', played: gbiPlayed, rated: 0, total: 100 },
    ],
  };
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Top100CoursesHubPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sectionAbsent = () => {
  expect(screen.queryByText('Your hundred')).toBeNull();
  expect(screen.queryByText('A life in golf, one list')).toBeNull();
  expect(screen.queryByRole('button', { name: /^#1 / })).toBeNull();
  expect(screen.queryByTestId('hundred-legend')).toBeNull();
};

beforeEach(() => {
  sessionStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  f.courses.mockReturnValue({
    data: { pages: [COURSES] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isPlaceholderData: false,
  });
  f.enrichment.mockReturnValue({ data: new Map(), isLoading: false });
});

afterEach(cleanup);

describe('HUNDRED_FIT_1_R — the under-five gate', () => {
  it('four played on the active list renders no heading, figure, grid or legend', () => {
    f.progress.mockReturnValue({ data: progressData(4, 0), isLoading: false, isFetchedAfterMount: true });
    mount();
    sectionAbsent();
  });

  it('five played renders the heading, figure, grid and legend', () => {
    f.progress.mockReturnValue({ data: progressData(5, 0), isLoading: false, isFetchedAfterMount: true });
    mount();
    expect(screen.getByText('Your hundred')).toBeInTheDocument();
    expect(screen.getByText('A life in golf, one list')).toBeInTheDocument();
    expect(screen.getByText('of 100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#1 Course 1' })).toBeInTheDocument();
    expect(screen.getByTestId('hundred-legend')).toBeInTheDocument();
  });

  it('the boundary sits at five, not four', () => {
    f.progress.mockReturnValue({ data: progressData(4, 0), isLoading: false, isFetchedAfterMount: true });
    const { unmount } = mount();
    sectionAbsent();
    unmount();
    f.progress.mockReturnValue({ data: progressData(5, 0), isLoading: false, isFetchedAfterMount: true });
    mount();
    expect(screen.getByText('Your hundred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#1 Course 1' })).toBeInTheDocument();
  });

  it('switching the active scope from nine played to three removes the section without remounting the page', () => {
    f.progress.mockReturnValue({ data: progressData(9, 3), isLoading: false, isFetchedAfterMount: true });
    mount();
    expect(screen.getByText('Your hundred')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'GB&I' }));
    sectionAbsent();
    // The page itself never remounted: the list head for the new scope is on screen.
    expect(screen.getByText('GB&I Top 100')).toBeInTheDocument();
  });
});

/* BRIEF_TOP100_GOLFERS_VS_OFFICIAL — the argument section against the panel. */
const ARG_COURSES = [
  { id: 'c1', rankGlobal: 1, rankGbi: 1, rating: 9 },
  { id: 'c2', rankGlobal: 2, rankGbi: 2, rating: 5 },
  { id: 'c3', rankGlobal: 3, rankGbi: 3, rating: 6 },
  { id: 'c4', rankGlobal: 4, rankGbi: null, rating: 7 },
].map(({ id, rankGlobal, rankGbi, rating }) => ({
  id,
  name: `Course ${id.slice(1)}`,
  country: 'England',
  region: null,
  sub_country: null,
  thumbnail_image: null,
  global_rank: rankGlobal,
  regional_rank: null,
  rating,
  list_memberships: [
    { list_slug: 'global', rank: rankGlobal },
    ...(rankGbi == null ? [] : [{ list_slug: 'gb-i', rank: rankGbi }]),
  ],
}));

function mountWithArgument() {
  f.courses.mockReturnValue({
    data: { pages: [ARG_COURSES] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isPlaceholderData: false,
  });
  f.enrichment.mockReturnValue({
    data: new Map(ARG_COURSES.map((c) => [c.id, { rating: c.rating, ratingCount: 5 }])),
    isLoading: false,
  });
  f.progress.mockReturnValue({ data: progressData(0, 0), isLoading: false, isFetchedAfterMount: true });
  return mount();
}

describe('BRIEF_TOP100_GOLFERS_VS_OFFICIAL — panel wiring', () => {
  it('the link shows when ranking is official, and clicking it switches the dropdown to Community rating', () => {
    mountWithArgument();
    expect(screen.getByText('Official rating')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /See the golfers' list/ }));
    expect(screen.getByText('Community rating')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /See the golfers' list/ })).toBeNull();
  });

  it('switching the active list from Global to GB&I recomputes both groups and the lede count', () => {
    mountWithArgument();
    // Global: four qualify; c4 rises (members 2nd, list 4th), c2 falls.
    expect(screen.getByText(/out of the 4 courses on this list/)).toBeInTheDocument();
    expect(screen.getByText('Course 4')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Golfers rank it 2nd versus 4th on the official list')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'GB&I' }));
    // GB&I: c4 is not on the list, so three qualify and the groups recompute.
    expect(screen.getByText(/out of the 3 courses on this list/)).toBeInTheDocument();
    expect(screen.queryByText('Course 4')).toBeNull();
    expect(screen.getByText((_, el) => el?.textContent === 'Golfers rank it 2nd versus 3rd on the official list')).toBeInTheDocument();
  });
});
