/**
 * BRIEF_COURSES_MEMBERS_SECTIONS — the reviewer's own rounds under a review
 * (get_review_author_rounds): the copy rules, the show/hide rules (an absent RPC
 * row means no strip), and the page gate settling on that read.
 *
 * BRIEF_LATEST_HOLES_OPTION_A removed the Latest holes "Plays" pill, so the
 * get_course_hole_ranks read and every test that encoded it are gone; the rail
 * tile's own tests live in src/test/latestHolesSection.test.tsx.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

const f = vi.hoisted(() => ({
  holes: [] as unknown[],
  rounds: [] as unknown[],
  pool: [] as unknown[],
  holeState: 'ready' as 'ready' | 'pending' | 'error',
  roundState: 'ready' as 'ready' | 'pending' | 'error',
  rpc: vi.fn(),
}));

/* The page's other sections report ready immediately: the gate under test is the
   reviews rail's own read, not the rest of the page. */
const readySection = vi.hoisted(() => async (id: string) => {
  const { useSectionReady } = await import('@/components/courses/browse/PageLoadGate');
  return () => {
    useSectionReady(id, true);
    return null;
  };
});

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => false }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (name: string, args: Record<string, unknown>) => f.rpc(name, args) },
}));
vi.mock('@/components/courses/useBrowseReviews', () => ({
  useBrowseReviews: () => ({ pool: f.pool, isLoading: false, isPending: false }),
}));
vi.mock('@/components/courses/useStatBrowse', () => ({
  useCourseBrowseTruth: () => ({ data: null, isLoading: false, isFetched: true }),
  useStatBrowseList: () => ({ rows: [], isLoading: false }),
}));
vi.mock('@/stores/reviewSheetStore', () => ({
  useReviewSheetStore: (sel?: (s: { open: () => void }) => unknown) => sel?.({ open: () => {} }),
}));
vi.mock('@/components/courses/CourseMasthead', () => ({ HERO_FIGURE_LABEL: {}, HERO_FIGURE_VALUE: {} }));
vi.mock('@/components/courses/browse/sectionShells', () => ({
  WhoPlayingShell: () => null,
  ByRegionShell: () => null,
  LatestCoursesShell: () => null,
  FiguresRowShell: () => null,
  LatestReviewsShell: () => null,
  LatestHolesShell: () => null,
  LatestHoleSkeletonCard: () => null,
  RailBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RailShelf: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/courses/StatBrowse', async () => ({ default: await readySection('list') }));
vi.mock('@/components/courses/browse/WhoPlayingSection', async () => ({ WhoPlayingSection: await readySection('whoPlaying') }));
vi.mock('@/components/courses/browse/ByRegionSection', async () => ({
  ByRegionSection: await readySection('byRegion'), ALL_COURSES_ANCHOR: 'all-courses',
}));
vi.mock('@/components/courses/browse/LatestCoursesSection', async () => ({ LatestCoursesSection: await readySection('latestCourses') }));
vi.mock('@/components/courses/browse/MostPlayedSection', async () => ({ MostPlayedSection: await readySection('mostPlayed') }));
vi.mock('@/components/courses/browse/HardestSection', async () => ({ HardestSection: await readySection('hardest') }));

const { default: CoursesBrowsePage } = await import('@/components/courses/CoursesBrowsePage');
const { ReviewRailSlot } = await import('@/components/courses/ReviewRailSlot');
const { toParFigure, roundsLabel, bestLabel, toAuthorRoundsMap } = await import('@/components/courses/reviewAuthorRounds');

/* ── fixtures ─────────────────────────────────────────────────────────── */

const holeRow = (id: string, courseId: string, holeNo: number): LatestHoleMedia => ({
  id, course_id: courseId, course_name: `Course ${courseId}`, hole_no: holeNo, media_type: 'image',
  media_url: `/photo-${id}.jpg`, poster_url: null, stream_id: null, duration_seconds: null,
  exif_captured_at: null, added_at: '2025-06-12T10:00:00Z', created_at: '2026-10-24T12:00:00Z',
  member_id: 'member', member_name: 'Thomas Holmes', member_avatar_url: null, par: 4, yards: 412,
});

const review = (id: string, userId: string): LatestReview => ({
  reviewId: id, userId, courseId: 'course-a', courseName: 'Course course-a', reviewerName: `Ada ${id}`,
  reviewerUsername: `ada${id}`, reviewerAvatar: null, rating: 8, quote: 'Worth the trip.',
  courseCountry: 'IRL', courseRegion: null, courseSubCountry: null, reviewText: 'Worth the trip.',
  breakdown: null, created_at: '2026-10-01T10:00:00Z',
} as unknown as LatestReview);

function reply<T>(state: 'ready' | 'pending' | 'error', value: T) {
  if (state === 'pending') return new Promise<T>(() => {});
  if (state === 'error') return Promise.reject(new Error('unavailable'));
  return Promise.resolve({ data: value, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  f.holes = [holeRow('one', 'course-a', 4), holeRow('two', 'course-b', 7), holeRow('three', 'course-c', 11)];
  f.rounds = [{ review_id: 'r1', rounds_here: 4, best_gross: 78, best_to_par: 6 }];
  f.pool = [review('r1', 'ada'), review('r2', 'bo')];
  f.holeState = 'ready'; f.roundState = 'ready';
  f.rpc.mockImplementation((name: string) => {
    if (name === 'get_latest_hole_media') return reply(f.holeState, f.holes);
    if (name === 'get_review_author_rounds') return reply(f.roundState, f.rounds);
    return Promise.resolve({ data: [], error: null });
  });
});

afterEach(cleanup);

const mount = (node: React.ReactNode) => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={cache}>{node}</QueryClientProvider></MemoryRouter>);
};

const page = () => mount(<CoursesBrowsePage onOpenDirectory={() => {}} />);
const held = (container: HTMLElement) => container.querySelector('[data-held]') ?? container.querySelector('[data-courses-fallback]');

/* ── the copy rules, in one place ─────────────────────────────────────── */

describe('the strip copy rules', () => {
  it('writes the to-par figure, the round label and the best label as specified', () => {
    expect(toParFigure(7)).toBe('+7');
    expect(toParFigure(0)).toBe('E');
    expect(toParFigure(-2)).toBe('\u22122');
    expect(roundsLabel(1)).toBe('ROUND HERE');
    expect(roundsLabel(2)).toBe('ROUNDS HERE');
    expect(roundsLabel(12)).toBe('ROUNDS HERE');
    expect(bestLabel(true)).toBe('YOUR BEST');
    expect(bestLabel(false)).toBe('THEIR BEST');
  });

  it('keys author rounds by review and keeps a null best as rounds-only', () => {
    const map = toAuthorRoundsMap([
      { review_id: 'r1', rounds_here: 4, best_gross: 78, best_to_par: 6 },
      { review_id: 'r2', rounds_here: 2, best_gross: null, best_to_par: null },
      { review_id: 'r3', rounds_here: 'x' },
    ]);
    expect([...map.keys()]).toEqual(['r1', 'r2']);
    expect(map.get('r2')).toEqual({ review_id: 'r2', rounds_here: 2, best_gross: null, best_to_par: null });
    expect(toAuthorRoundsMap(null).size).toBe(0);
  });
});

/* ── §2 the reviewer's rounds under a review ──────────────────────────── */

const footOf = (container: HTMLElement, index: number) => container.querySelectorAll('[data-review-foot]')[index];
const withRounds = (container: HTMLElement) => [...container.querySelectorAll('[data-review-foot]')].filter((n) => n.textContent?.includes('here'));

describe('the played strip', () => {
  it('shows only for the review the RPC answered', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada'), review('r2', 'bo')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap(f.rounds)} viewerId="someone-else" />);
    expect(withRounds(view.container)).toHaveLength(1);
    expect(footOf(view.container, 0).textContent).toBe('Ada r1 \u00B7 4 rounds here \u00B7 best 78');
    expect(footOf(view.container, 1).textContent).toBe('Ada r2');
  });

  it('draws rounds only when the reviewer has no eighteen at that course', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r2', 'bo')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r2', rounds_here: 2, best_gross: null, best_to_par: null }])} />);
    expect(footOf(view.container, 0).textContent).toBe('Ada r2 \u00B7 2 rounds here');
  });

  it("calls the best score the viewer's own when the review is theirs", () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap(f.rounds)} viewerId="ada" />);
    expect(footOf(view.container, 0).textContent).toBe('Ada r1 \u00B7 4 rounds here \u00B7 your best 78');
  });

  it('reads one round as ROUND HERE and an under-par best in the red figure', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 1, best_gross: 71, best_to_par: -2 }])} />);
    expect(footOf(view.container, 0).textContent).toBe('Ada r1 \u00B7 1 round here \u00B7 best 71');
  });

  it('shows the gross alone when the to-par is unknown', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 3, best_gross: 74, best_to_par: null }])} />);
    expect(footOf(view.container, 0).textContent).toBe('Ada r1 \u00B7 3 rounds here \u00B7 best 74');
  });

  it('draws nothing for a caller that supplies no rounds at all', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}} />);
    expect(footOf(view.container, 0).textContent).toBe('Ada r1');
  });
});

/* ── the page gate waits for both reads ───────────────────────────────── */

describe('the page gate', () => {
  it('holds the page while the reviewer-rounds read is unresolved, then opens with the strip', async () => {
    let release: (value: unknown) => void = () => {};
    f.rpc.mockImplementation((name: string) => {
      if (name === 'get_review_author_rounds') return new Promise(resolve => { release = resolve; });
      return Promise.resolve({ data: [], error: null });
    });
    const view = page();
    expect(held(view.container)).not.toBeNull();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_review_author_rounds', { p_review_ids: ['r1', 'r2'] }));
    await act(async () => { release({ data: f.rounds, error: null }); });
    await waitFor(() => expect(held(view.container)).toBeNull());
    expect(withRounds(view.container)).toHaveLength(1);
    expect(f.rpc).toHaveBeenCalledWith('get_review_author_rounds', { p_review_ids: ['r1', 'r2'] });
  });

  it('never asks for rounds the page has no reviews for', async () => {
    f.pool = [];
    f.rpc.mockImplementation((name: string) => (name === 'get_review_author_rounds'
      ? new Promise(() => {})
      : Promise.resolve({ data: [], error: null })));
    const view = page();
    await waitFor(() => expect(held(view.container)).toBeNull());
    expect(f.rpc.mock.calls.filter(call => call[0] === 'get_review_author_rounds')).toHaveLength(0);
  });
});
