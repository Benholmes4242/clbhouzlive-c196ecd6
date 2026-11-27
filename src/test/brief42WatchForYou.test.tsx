import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const f = vi.hoisted(() => ({
  videos: { data: { pages: [[]] as unknown[][] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: () => {}, fetchNextPage: () => {} },
  clips: { data: { pages: [[]] as unknown[][] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: () => {}, fetchNextPage: () => {} },
  moments: [] as unknown[],
  progress: new Map<string, { position: number; duration: number }>(),
  spotlight: [] as unknown[],
  pros: new Map<string, { pro_kind: string }>(),
  featured: [] as unknown[],
  watchPros: { data: [] as unknown[] | null, error: null as unknown },
  creatorVideos: {} as Record<string, unknown[]>,
  scroll: vi.fn(),
  openWithOrigin: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string } | string) => (typeof o === 'string' ? o : o?.defaultValue ?? '') }) }));
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => f.videos }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => f.clips }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: f.progress }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({ useMomentsOfTheWeek: () => ({ data: f.moments, isFetched: true, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }) }));
vi.mock('@/components/explore-tab-new/courseled/MomentTile', () => ({ MomentTile: () => <div /> }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => <div data-stub="lead" /> }));
vi.mock('@/features/explore-magazine/watch/CourseVideosShelf', async (orig) => ({ ...(await orig<typeof import('@/features/explore-magazine/watch/CourseVideosShelf')>()), CourseVideosShelf: () => <div data-stub="filmed-at" /> }));
vi.mock('@/features/explore-magazine/watch/useWatchBottom', () => ({ useWatchSpotlights: () => ({ data: f.spotlight, isError: false }), useCreatorVideos: () => ({ data: [] }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: () => ({ members: f.pros, isLoading: false }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/pro-verification/ProOrVerifiedMark', () => ({ ProOrVerifiedMark: () => null }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('@/features/find-people/useRecentActivity', () => ({ useRecentActivity: () => new Map() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/feed/usePostVideoDetails', () => ({ usePostVideoDetails: () => new Map() }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.openWithOrigin }));
vi.mock('@/lib/getScrollParent', async (orig) => ({ ...(await orig<typeof import('@/lib/getScrollParent')>()), scrollPageToTop: f.scroll }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: () => () => {}, IN_VIEW_THRESHOLD: 0.6, MAX_PLAYING: 1 }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, deliverVerdict: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));

import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { __resetSpotlight } from '@/features/explore-magazine/watch/CreatorSpotlight';
import { WATCH_CHIPS, mapWatchFilter } from '@/features/explore-magazine/watch/watchFilters';
import { featuredReason, forYouCuts } from '@/features/explore-magazine/watch/forYouRules';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

const NOW = Date.now();
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
const hub = (id: string, extra: Record<string, unknown> = {}) => ({ post_id: id, duration_seconds: 900, media_type: 'video', media_url: `https://x/${id}.mp4`, poster_url: null, creator_display_name: 'A', actor_id: 'a', post_created_at: ago(40), like_count: 0, ...extra });
const feat = (id: string, extra: Record<string, unknown> = {}) => ({ post_id: id, actor_type: 'personal', actor_id: `fa-${id}`, display_name: `Creator ${id}`, handle: id, avatar_url: null, is_verified: false, caption: `Title ${id}`, media_url: null, hls_url: null, poster_url: `https://x/${id}.jpg`, stream_id: null, duration_seconds: 86, width: 1, height: 1, like_count: 1, comment_count: 0, created_at: ago(20), course_id: null, course_name: null, reason: 'most_liked', rank: 1, score: 1, ...extra });
const cvid = (id: string, actor: string, days: number) => ({ post_id: id, actor_type: 'personal', actor_id: actor, display_name: `Coach ${actor}`, handle: actor, avatar_url: null, is_verified: true, caption: `Lesson ${id}`, media_url: null, hls_url: null, poster_url: null, stream_id: null, duration_seconds: 43, width: 1, height: 1, like_count: 0, created_at: ago(days), course_id: null, course_name: null, region: null });
const coach = (id: string, club: string | null) => ({ user_id: id, display_name: `Coach ${id}`, username: id, avatar_url: null, pro_body: 'PGA', pro_club: club, pro_verified_at: ago(100) });

function wrap(filter?: string) {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><WatchFeed userId="me" onDepart={() => {}} initialFilter={filter} /></QueryClientProvider></MemoryRouter>);
}
const q = (sel: string) => document.querySelector(sel);
const before = (a: Element | null, b: Element | null) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

function seedAll() {
  f.featured = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map((id, i) => feat(id, { like_count: 10 - i }));
  f.watchPros = { data: [coach('c1', 'Wentworth Club'), coach('c2', null)], error: null };
  f.creatorVideos = { c1: [cvid('cv1', 'c1', 5), cvid('cv3', 'c1', 1)], c2: [cvid('cv2', 'c2', 3)] };
  f.videos.data = { pages: [[
    hub('l1', { post_created_at: ago(1) }), hub('l2', { post_created_at: ago(2), like_count: 5 }), hub('cp', { post_created_at: ago(2) }),
    ...Array.from({ length: 12 }, (_, i) => hub(`lx${i}`, { post_created_at: ago(3 + i) })),
    hub('ml1', { post_created_at: ago(20), like_count: 4 }), hub('ml2', { post_created_at: ago(21), like_count: 4 }), hub('ml3', { post_created_at: ago(22), like_count: 9 }),
  ]] };
  f.clips.data = { pages: [[hub('s1', { duration_seconds: 40, post_created_at: ago(1), is_followed_by_me: true }), hub('s2', { duration_seconds: 40, post_created_at: ago(2), is_followed_by_me: true }), hub('s3', { duration_seconds: 40 })]] };
  f.progress = new Map([['cp', { position: 300, duration: 900 }]]);
  f.moments = ['a', 'b', 'c'].map(k => ({ key: k, post: { userId: `m-${k}`, displayName: `Member ${k}` }, courseName: 'Somewhere' }));
  f.spotlight = [{ actor_type: 'personal', actor_id: 'sp1', display_name: 'Ellie', handle: 'ellie', avatar_url: null, is_verified: false, videos: 3 }];
}

beforeEach(() => {
  __resetSpotlight();
  f.videos.data = { pages: [[]] }; f.clips.data = { pages: [[]] }; f.moments = []; f.progress = new Map(); f.spotlight = []; f.pros = new Map();
  f.featured = []; f.watchPros = { data: [], error: null }; f.creatorVideos = {};
  f.openWithOrigin.mockReset(); f.scroll.mockReset();
  f.rpc.mockReset();
  f.rpc.mockImplementation(async (name: string, args: { p_actor_id?: string }) => {
    if (name === 'get_watch_featured') return { data: f.featured, error: null };
    if (name === 'get_watch_pros') return f.watchPros;
    if (name === 'get_creator_videos') return { data: f.creatorVideos[args.p_actor_id ?? ''] ?? [], error: null };
    return { data: [], error: null };
  });
  Element.prototype.scrollTo = vi.fn() as never;
});
afterEach(cleanup);

describe('Brief 42 For you order', () => {
  it('renders the ten sections in order and none of the retired ones', async () => {
    seedAll();
    const base = f.rpc.getMockImplementation()!;
    f.creatorVideos = { ...f.creatorVideos, biz1: [cvid('bv1', 'biz1', 1), cvid('bv2', 'biz1', 2), cvid('bv3', 'biz1', 3)] };
    f.rpc.mockImplementation(async (name: string, args: { p_actor_id?: string }) => name === 'get_watch_businesses'
      ? { data: [{ business_id: 'biz1', name: 'Woking GC', logo_url: null, category: 'Golf club', city: 'Woking', region: null, country: null, video_count: 3, latest_video_at: ago(1) }], error: null }
      : base(name, args));
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    await waitFor(() => expect(q('[data-watch-featured-rail]')).not.toBeNull());
    const order = [q('[data-watch-featured-rail]'), q('[data-fy-section="continue"]'), q('[data-fy-section="coaching"]'), q('[data-fy-section="long"]'),
      q('[data-fy-section="shorts"]'), q('[data-fy-section="community"]'), q('[data-fy-section="following"]'), q('[data-spotlight-section]'),
      q('[data-fy-section="businesses"]'), q('[data-stub="filmed-at"]'), q('[data-fy-end]')];
    order.forEach(el => expect(el).not.toBeNull());
    for (let i = 1; i < order.length; i++) expect(before(order[i - 1], order[i])).toBe(true);
    expect(q('[data-watch-featured]')).toBeNull();
    expect(q('[data-regions-shelf]')).toBeNull();
    expect(q('[data-top100-shelf]')).toBeNull();
    expect(q('[data-woven-kind]')).toBeNull();
    expect(document.querySelectorAll('[data-watch-card="long"]').length).toBeLessThanOrEqual(10);
    expect(screen.getByText('Moments from members')).toBeTruthy();
    expect(screen.queryByText("This month's most liked")).toBeNull();
  });
});

describe('Brief 42 Featured rail', () => {
  it('five ranked cards with duration pill, Likes / Comments, ticks and the hint', async () => {
    seedAll();
    wrap();
    await waitFor(() => expect(q('[data-watch-featured-rail]')).not.toBeNull());
    const cards = document.querySelectorAll('[data-watch-featured-rail] [data-ten-rail-rank]');
    expect(Array.from(cards).map(c => c.getAttribute('data-ten-rail-rank'))).toEqual(['1', '2', '3', '4', '5']);
    expect(cards[0].querySelector('[data-featured-duration]')?.textContent).toBe('1:26');
    expect(Array.from(cards[0].querySelectorAll('.clb-ten-stat small')).map(s => s.textContent)).toEqual(['Likes', 'Comments']);
    expect(document.querySelectorAll('[data-watch-featured-rail] .clb-ten-tick')).toHaveLength(5);
    expect(screen.getByText('Swipe for 2 to 5')).toBeTruthy();
    fireEvent.click(cards[2]);
    expect(f.openWithOrigin.mock.calls[0][0].index).toBe(2);
    expect(f.openWithOrigin.mock.calls[0][0].openedFrom).toBe('amateur-watch');
  });
  const set = [{ post_id: 'a', like_count: 9, created_at: ago(30), course_name: null }, { post_id: 'b', like_count: 2, created_at: ago(1), course_name: 'Royal County Down Golf Club - Championship' }];
  it('reason: most liked this week wins first', () => expect(featuredReason(set[0], set, 'teaching_pro', NOW)).toBe('Most liked this week'));
  it('reason: From a PGA pro', () => expect(featuredReason(set[1], set, 'teaching_pro', NOW)).toBe('From a PGA pro'));
  it('reason: From a tour pro', () => expect(featuredReason(set[1], set, 'tour_pro', NOW)).toBe('From a tour pro'));
  it('reason: Filmed at the short course name', () => expect(featuredReason(set[1], set, null, NOW)).toMatch(/^Filmed at Royal County Down/));
  it('reason: New this week', () => expect(featuredReason({ ...set[1], course_name: null }, set, null, NOW)).toBe('New this week'));
  it('reason: else empty', () => expect(featuredReason({ ...set[1], course_name: null, created_at: ago(9) }, set, null, NOW)).toBeNull());
});

describe('Brief 42 Coaching', () => {
  it('is absent when get_watch_pros errors', async () => {
    seedAll(); f.watchPros = { data: null, error: { message: 'x' } };
    wrap();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_watch_pros', { p_limit: 12 }));
    await waitFor(() => expect(q('[data-coaching-skeleton]')).toBeNull());
    expect(q('[data-fy-section="coaching"]')).toBeNull();
    expect(screen.queryByText('From the PGA pros')).toBeNull();
  });
  it('Brief 43: with no coach videos the section shows the heading and coach cards, and no video rail', async () => {
    seedAll(); f.creatorVideos = {};
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    expect(document.querySelectorAll('[data-fy-section="coaching"] [data-coach-card]')).toHaveLength(2);
    expect(q('[data-watch-rail="coaching"]')).toBeNull();
  });
  it('merges newest first and renders two coach cards; a coach without a club omits the line', async () => {
    seedAll();
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    const tiles = Array.from(document.querySelectorAll('[data-watch-rail="coaching"] [data-fy-post]')).map(t => t.getAttribute('data-fy-post'));
    expect(tiles).toEqual(['cv3', 'cv2', 'cv1']);
    const cards = document.querySelectorAll('[data-fy-section="coaching"] [data-coach-card]');
    expect(Array.from(cards).map(c => c.getAttribute('data-coach-card'))).toEqual(['c1', 'c2']);
    expect(cards[0].querySelector('[data-coach-body]')?.textContent).toBe('PGA Professional');
    expect(cards[0].querySelector('[data-coach-club]')?.textContent).toBe('Wentworth Club');
    expect(cards[1].querySelector('[data-coach-club]')).toBeNull();
    expect(cards[0].querySelector('[data-coach-count]')?.textContent).toBe('2');
    expect(cards[0].querySelector('[data-coach-follow]')?.textContent).toBe('Follow');
  });
});

describe('Brief 42 Coaching chip', () => {
  it('exists between Long form and Community, maps, and renders coach cards plus the grid', async () => {
    expect(WATCH_CHIPS).toEqual(['all', 'quick', 'long', 'coaching', 'community']);
    expect(mapWatchFilter('coaching')).toBe('coaching');
    seedAll();
    wrap('coaching');
    await waitFor(() => expect(q('[data-fy-chip="coaching"]')).not.toBeNull());
    expect(document.querySelectorAll('[data-fy-chip="coaching"] [data-coach-card]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-watch-grid="coaching"] [data-fy-post]')).toHaveLength(3);
  });
});

const row = (id: string, extra: Record<string, unknown> = {}) => hub(id, extra) as unknown as HubRpcRow;
describe('Brief 42 Following and Most liked', () => {
  it('Following hides with fewer than two', () => {
    expect(forYouCuts({ featuredIds: [], coaching: [], rows: [row('a', { is_followed_by_me: true })], now: NOW }).following).toEqual([]);
    expect(forYouCuts({ featuredIds: [], coaching: [], rows: [row('a', { is_followed_by_me: true, duration_seconds: 30 }), row('b', { is_followed_by_me: true, duration_seconds: 30 })], now: NOW }).following).toHaveLength(2);
  });
});

describe('Brief 42 one appearance per video', () => {
  it('no post appears twice across Featured, Coaching, Long form, Following and Clubs and brands', async () => {
    seedAll();
    f.featured = [feat('l1'), feat('f2'), feat('f3'), feat('f4'), feat('f5')];
    f.creatorVideos = { c1: [cvid('l2', 'c1', 1)], c2: [cvid('cv2', 'c2', 3)] };
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    await waitFor(() => expect(q('[data-watch-featured-rail]')).not.toBeNull());
    const ids = [
      ...Array.from(document.querySelectorAll('[data-watch-featured-rail] [data-ten-media-card]')).map(e => e.getAttribute('data-ten-media-card')),
      ...['coaching', 'long', 'following', 'businesses'].flatMap(k => Array.from(document.querySelectorAll(`[data-watch-rail="${k}"] [data-fy-post]`)).map(e => e.getAttribute('data-fy-post'))),
    ];
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Brief 42 Worth following', () => {
  it('excludes verified teaching pros', async () => {
    seedAll();
    f.spotlight = [{ actor_type: 'personal', actor_id: 'tp', display_name: 'Teacher', handle: 'tp', avatar_url: null, is_verified: false, videos: 3 },
      { actor_type: 'personal', actor_id: 'ok', display_name: 'Ellie', handle: 'ok', avatar_url: null, is_verified: false, videos: 3 }];
    f.pros = new Map([['tp', { pro_kind: 'teaching_pro' }]]);
    wrap();
    await waitFor(() => expect(q('[data-spotlight="ok"]')).not.toBeNull());
    expect(q('[data-spotlight="tp"]')).toBeNull();
  });
});

describe('Brief 42 end', () => {
  it('"Browse all long form" selects the Long form chip and scrolls to the top', async () => {
    seedAll();
    wrap();
    fireEvent.click(screen.getByText('Browse all long form ›'));
    expect(screen.getByRole('tab', { name: 'Long form' }).getAttribute('aria-selected')).toBe('true');
    expect(f.scroll).toHaveBeenCalled();
  });
});
