/**
 * BRIEF_COURSES_MEMBERS_SECTIONS — the two member-score additions.
 *
 * §1 the "Plays" pill on the Latest holes rail (get_course_hole_ranks)
 * §2 the reviewer's own rounds under a review (get_review_author_rounds)
 *
 * Covers the copy rules, the show/hide rules (an absent RPC row means no pill
 * and no strip), and both page-gate reads settling.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

const f = vi.hoisted(() => ({
  holes: [] as unknown[],
  ranks: [] as unknown[],
  rounds: [] as unknown[],
  pool: [] as unknown[],
  holeState: 'ready' as 'ready' | 'pending' | 'error',
  rankState: 'ready' as 'ready' | 'pending' | 'error',
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
const { LatestHolesSection } = await import('@/components/courses/browse/LatestHolesSection');
const { ReviewRailSlot } = await import('@/components/courses/ReviewRailSlot');
const { PageLoadGate } = await import('@/components/courses/browse/PageLoadGate');
const { playsFigure, rankPhrase, rankKey, toRanksMap } = await import('@/components/courses/browse/holePlays');
const { toParFigure, roundsLabel, bestLabel, toAuthorRoundsMap } = await import('@/components/courses/reviewAuthorRounds');

/* ── fixtures ─────────────────────────────────────────────────────────── */

const holeRow = (id: string, courseId: string, holeNo: number): LatestHoleMedia => ({
  id, course_id: courseId, course_name: `Course ${courseId}`, hole_no: holeNo, media_type: 'image',
  media_url: `/photo-${id}.jpg`, poster_url: null, stream_id: null, duration_seconds: null,
  exif_captured_at: null, added_at: '2025-06-12T10:00:00Z', created_at: '2026-10-24T12:00:00Z',
  member_id: 'member', member_name: 'Thomas Holmes', member_avatar_url: null, par: 4, yards: 412,
});

const rankRow = (courseId: string, holeNo: number, avg: number, rank: number) => ({
  course_id: courseId, hole_no: holeNo, rounds: 30, avg_to_par: avg, difficulty_rank: rank, holes_ranked: 18,
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
  f.ranks = [rankRow('course-a', 4, 0.42, 3)];
  f.rounds = [{ review_id: 'r1', rounds_here: 4, best_gross: 78, best_to_par: 6 }];
  f.pool = [review('r1', 'ada'), review('r2', 'bo')];
  f.holeState = 'ready'; f.rankState = 'ready'; f.roundState = 'ready';
  f.rpc.mockImplementation((name: string) => {
    if (name === 'get_latest_hole_media') return reply(f.holeState, f.holes);
    if (name === 'get_course_hole_ranks') return reply(f.rankState, f.ranks);
    if (name === 'get_review_author_rounds') return reply(f.roundState, f.rounds);
    return Promise.resolve({ data: [], error: null });
  });
});

afterEach(cleanup);

const mount = (node: React.ReactNode) => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={cache}>{node}</QueryClientProvider></MemoryRouter>);
};

const rail = () => mount(<LatestHolesSection />);
const gated = () => mount(<PageLoadGate expect={['latestHoles']} fallback={<div data-held />}><LatestHolesSection /></PageLoadGate>);
const page = () => mount(<CoursesBrowsePage onOpenDirectory={() => {}} />);
const held = (container: HTMLElement) => container.querySelector('[data-held]') ?? container.querySelector('[data-courses-fallback]');

/* ── the copy rules, in one place ─────────────────────────────────────── */

describe('the pill and strip copy rules', () => {
  it('signs the average exactly as the mock prints it', () => {
    expect(playsFigure(0)).toBe('level');
    expect(playsFigure(0.42)).toBe('+0.42');
    expect(playsFigure(-0.15)).toBe('\u22120.15');
    expect(playsFigure(2)).toBe('+2.00');
  });

  it('names rank one outright and every other rank by ordinal', () => {
    expect(rankPhrase(1)).toBe('Hardest hole');
    expect(rankPhrase(2)).toBe('2nd hardest hole');
    expect(rankPhrase(3)).toBe('3rd hardest hole');
    expect(rankPhrase(4)).toBe('4th hardest hole');
    expect(rankPhrase(11)).toBe('11th hardest hole');
    expect(rankPhrase(12)).toBe('12th hardest hole');
    expect(rankPhrase(13)).toBe('13th hardest hole');
    expect(rankPhrase(18)).toBe('18th hardest hole');
    expect(rankPhrase(21)).toBe('21st hardest hole');
    expect(rankPhrase(22)).toBe('22nd hardest hole');
    expect(rankPhrase(23)).toBe('23rd hardest hole');
  });

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

  it('keys ranks by course AND hole and drops incomplete rows', () => {
    const map = toRanksMap([
      rankRow('course-a', 4, 0.5, 2),
      { course_id: 'course-a', hole_no: 5, avg_to_par: 0.5 },
      { course_id: 'course-a', hole_no: 6, difficulty_rank: 1 },
      'not a row',
    ]);
    expect([...map.keys()]).toEqual(['course-a|4']);
    expect(map.get(rankKey('course-a', 4))?.difficulty_rank).toBe(2);
    expect(toRanksMap(undefined).size).toBe(0);
    expect(toRanksMap('nope').size).toBe(0);
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

/* ── §1 the pill on the Latest holes rail ─────────────────────────────── */

describe('the Plays pill', () => {
  it('marks only the tile whose course and hole the RPC ranked', async () => {
    const view = rail();
    await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
    expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent)
      .toBe('Plays +0.42· 3rd hardest hole');
    expect(view.container.querySelectorAll('button')[0].getAttribute('aria-label'))
      .toBe('Hole 4, Course course-a, plays +0.42, 3rd hardest hole');
  });

  it('leaves an unranked tile exactly as it was', async () => {
    const view = rail();
    await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
    const cards = view.container.querySelectorAll('button');
    expect(cards[1].querySelector('[data-hole-plays]')).toBeNull();
    expect(cards[1].getAttribute('aria-label')).toBe('Hole 7, Course course-b');
    expect(cards[2].getAttribute('aria-label')).toBe('Hole 11, Course course-c');
  });

  it('asks for exactly the courses on the rail, once', async () => {
    rail();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_course_hole_ranks', { p_course_ids: ['course-a', 'course-b', 'course-c'] }));
    expect(f.rpc.mock.calls.filter(call => call[0] === 'get_course_hole_ranks')).toHaveLength(1);
  });

  it('never marks a tile from a rank belonging to another hole', async () => {
    f.ranks = [rankRow('course-a', 9, 0.42, 3)];
    const view = gated();
    await waitFor(() => expect(held(view.container)).toBeNull());
    expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
  });

  it('paints an under-par average in the red figure and names rank one outright', async () => {
    f.ranks = [rankRow('course-a', 4, -0.15, 1)];
    const view = rail();
    await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
    const figure = view.container.querySelector('[data-plays-figure]') as HTMLElement;
    expect(figure.textContent).toBe('Plays \u22120.15');
    expect(figure.style.color).toBe('rgb(226, 75, 63)');
    expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent)
      .toBe('Plays \u22120.15· Hardest hole');
  });

  it('keeps an over-par figure under CSS control', async () => {
    const view = rail();
    await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
    expect((view.container.querySelector('[data-plays-figure]') as HTMLElement).style.color).toBe('');
  });

  it('settles the rail with no pills when the ranks read fails', async () => {
    f.rankState = 'error';
    const view = rail();
    await waitFor(() => expect(view.container.querySelectorAll('button')).toHaveLength(3));
    expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
  });
});

/* ── §2 the reviewer's rounds under a review ──────────────────────────── */

const stripOf = (container: HTMLElement, index: number) => container.querySelectorAll('[data-review-played]')[index];

describe('the played strip', () => {
  it('shows only for the review the RPC answered', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada'), review('r2', 'bo')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap(f.rounds)} viewerId="someone-else" />);
    expect(view.container.querySelectorAll('[data-review-played]')).toHaveLength(1);
    expect(stripOf(view.container, 0).textContent).toBe('4ROUNDS HERE78+6THEIR BEST');
    expect(view.container.querySelectorAll('[data-played-figure]')).toHaveLength(2);
    expect(stripOf(view.container, 0).previousElementSibling).not.toBeNull();
  });

  it('draws rounds only when the reviewer has no eighteen at that course', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r2', 'bo')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r2', rounds_here: 2, best_gross: null, best_to_par: null }])} />);
    expect(stripOf(view.container, 0).textContent).toBe('2ROUNDS HERE');
    expect(view.container.querySelector('[data-played-figure="best"]')).toBeNull();
  });

  it("calls the best score the viewer's own when the review is theirs", () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap(f.rounds)} viewerId="ada" />);
    expect(stripOf(view.container, 0).textContent).toBe('4ROUNDS HERE78+6YOUR BEST');
  });

  it('reads one round as ROUND HERE and an under-par best in the red figure', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 1, best_gross: 71, best_to_par: -2 }])} />);
    expect(stripOf(view.container, 0).textContent).toBe('1ROUND HERE71\u22122THEIR BEST');
    expect((view.container.querySelector('[data-played-to-par]') as HTMLElement).style.color).toBe('rgb(226, 75, 63)');
  });

  it('shows the gross alone when the to-par is unknown', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}}
      authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 3, best_gross: 74, best_to_par: null }])} />);
    expect(stripOf(view.container, 0).textContent).toBe('3ROUNDS HERE74THEIR BEST');
    expect(view.container.querySelector('[data-played-to-par]')).toBeNull();
  });

  it('draws nothing for a caller that supplies no rounds at all', () => {
    const view = mount(<ReviewRailSlot reviews={[review('r1', 'ada')]} onReviewPress={() => {}} />);
    expect(view.container.querySelectorAll('[data-review-played]')).toHaveLength(0);
  });
});

/* ── the page gate waits for both reads ───────────────────────────────── */

describe('the page gate', () => {
  it('holds the rail while the ranks read is unresolved', async () => {
    f.rankState = 'pending';
    const view = gated();
    await waitFor(() => expect(view.container.querySelectorAll('button')).toHaveLength(3));
    expect(held(view.container)).not.toBeNull();
    expect((view.container.querySelector('section')?.parentElement as HTMLElement).style.display).toBe('none');
  });

  it('opens the rail once the ranks read has settled', async () => {
    let release: (value: unknown) => void = () => {};
    f.rpc.mockImplementation((name: string) => {
      if (name === 'get_course_hole_ranks') return new Promise(resolve => { release = resolve; });
      if (name === 'get_latest_hole_media') return reply('ready', f.holes);
      return Promise.resolve({ data: [], error: null });
    });
    const view = gated();
    expect(held(view.container)).not.toBeNull();
    // The read starts once the rail knows which courses it is showing.
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_course_hole_ranks', { p_course_ids: ['course-a', 'course-b', 'course-c'] }));
    await act(async () => { release({ data: f.ranks, error: null }); });
    await waitFor(() => expect(held(view.container)).toBeNull());
    expect(view.container.querySelectorAll('button')).toHaveLength(3);
    expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1);
  });

  it('opens the rail with no pills when the ranks read fails', async () => {
    f.rankState = 'error';
    const view = gated();
    await waitFor(() => expect(held(view.container)).toBeNull());
    expect(view.container.querySelectorAll('button')).toHaveLength(3);
    expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
  });

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
    expect(view.container.querySelectorAll('[data-review-played]')).toHaveLength(1);
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
