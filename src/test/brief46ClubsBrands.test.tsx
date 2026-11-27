/** Brief 46: Clubs and brands replaces Most liked at position 9. Harness copied from brief42WatchForYou. */
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
import { Route, Routes } from 'react-router-dom';
import { businessLine } from '@/features/explore-magazine/watch/forYouRules';

const bvid = (id: string, biz: string, days: number) => ({ ...cvid(id, biz, days), actor_type: 'business', display_name: `Biz ${biz}`, caption: `Clip ${id}` });
const biz = (id: string, extra: Record<string, unknown> = {}) => ({ business_id: id, name: `Biz ${id}`, logo_url: `https://x/${id}.png`, category: 'Golf club', city: null, region: null, country: null, video_count: 2, latest_video_at: ago(1), ...extra });
function withBusinesses(result: { data: unknown; error: unknown }) {
  const base = f.rpc.getMockImplementation()!;
  f.rpc.mockImplementation(async (name: string, args: { p_actor_id?: string }) => name === 'get_watch_businesses' ? result : base(name, args));
}
function wrapRoutes() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Routes><Route path="/business/:id" element={<div data-biz-page />} /><Route path="*" element={<WatchFeed userId="me" onDepart={() => {}} />} /></Routes>
  </QueryClientProvider></MemoryRouter>);
}
const twoBiz = () => {
  f.creatorVideos = { ...f.creatorVideos, b1: [bvid('b1v1', 'b1', 1), bvid('b1v2', 'b1', 4)], b2: [bvid('b2v1', 'b2', 2), bvid('b2v2', 'b2', 3)] };
  withBusinesses({ data: [biz('b1', { city: 'Woking', region: 'Surrey' }), biz('b2', { region: 'Kent', country: 'England' })], error: null });
};

describe('Brief 46 Clubs and brands', () => {
  it('1. renders "From clubs and brands" in position 9 and no "This month\'s most liked"', async () => {
    seedAll(); twoBiz(); wrap();
    await waitFor(() => expect(q('[data-fy-section="businesses"]')).not.toBeNull());
    expect(before(q('[data-spotlight-section]'), q('[data-fy-section="businesses"]'))).toBe(true);
    expect(before(q('[data-fy-section="businesses"]'), q('[data-stub="filmed-at"]'))).toBe(true);
    expect(screen.getByText('From clubs and brands')).toBeTruthy();
    expect(screen.queryByText("This month's most liked")).toBeNull();
  });
  it('2. two businesses, four videos: merged newest-first tiles with tick; two cards with logo, name + tick, line, count, Follow', async () => {
    seedAll(); twoBiz(); wrap();
    await waitFor(() => expect(q('[data-fy-section="businesses"]')).not.toBeNull());
    const tiles = [...document.querySelectorAll('[data-watch-rail="businesses"] [data-fy-post]')];
    expect(tiles.map(t => t.getAttribute('data-fy-post'))).toEqual(['b1v1', 'b2v1', 'b2v2', 'b1v2']);
    tiles.forEach(t => expect(t.querySelector('[aria-label="Verified"]')).not.toBeNull());
    const cards = [...document.querySelectorAll('[data-business-card]')];
    expect(cards.map(c => c.getAttribute('data-business-card'))).toEqual(['b1', 'b2']);
    cards.forEach(c => { expect(c.querySelector('img')).not.toBeNull(); expect(c.querySelector('[aria-label="Verified"]')).not.toBeNull(); expect(c.querySelector('[data-business-count]')).toHaveTextContent('2'); expect(c.querySelector('[data-coach-follow]')).toHaveTextContent('Follow'); });
    expect(cards[0].querySelector('[data-business-line]')).toHaveTextContent('Golf club · Woking');
    expect(cards[1].querySelector('[data-business-line]')).toHaveTextContent('Golf club · Kent');
    expect(businessLine({ category: 'Brand', city: null, region: null, country: 'England' })).toBe('Brand · England');
    expect(businessLine({ category: null, city: null, region: null, country: 'England' })).toBe('England');
  });
  it('3. fewer than three videos after de-duplication, or the RPC erroring: no section', async () => {
    seedAll();
    f.featured = ['b1v1', 'f2', 'f3', 'f4', 'f5'].map(id => feat(id));
    f.creatorVideos = { ...f.creatorVideos, b1: [bvid('b1v1', 'b1', 1), bvid('b1v2', 'b1', 2), bvid('b1v3', 'b1', 3)] };
    withBusinesses({ data: [biz('b1')], error: null });
    let v = wrap();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_creator_videos', expect.objectContaining({ p_actor_type: 'business', p_actor_id: 'b1' })));
    await waitFor(() => expect(q('[data-businesses-skeleton]')).toBeNull());
    expect(q('[data-fy-section="businesses"]')).toBeNull();
    v.unmount();
    f.rpc.mockReset(); seedAll();
    f.rpc.mockImplementation(async (name: string, args: { p_actor_id?: string }) => name === 'get_watch_businesses' ? { data: null, error: { message: 'boom' } }
      : name === 'get_watch_featured' ? { data: f.featured, error: null } : name === 'get_watch_pros' ? f.watchPros : name === 'get_creator_videos' ? { data: f.creatorVideos[args.p_actor_id ?? ''] ?? [], error: null } : { data: [], error: null });
    v = wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    await waitFor(() => expect(q('[data-businesses-skeleton]')).toBeNull());
    expect(q('[data-fy-section="businesses"]')).toBeNull();
    expect(screen.queryByText('Clubs and brands')).toBeNull();
  });
  it('4. a video already shown in an earlier section is not repeated', async () => {
    seedAll();
    f.featured = ['b1v1', 'f2', 'f3', 'f4', 'f5'].map(id => feat(id));
    f.creatorVideos = { ...f.creatorVideos, b1: [bvid('b1v1', 'b1', 1), bvid('b1v2', 'b1', 2), bvid('b1v3', 'b1', 3), bvid('b1v4', 'b1', 4)] };
    withBusinesses({ data: [biz('b1')], error: null });
    wrap();
    await waitFor(() => expect(q('[data-fy-section="businesses"]')).not.toBeNull());
    expect([...document.querySelectorAll('[data-watch-rail="businesses"] [data-fy-post]')].map(t => t.getAttribute('data-fy-post'))).toEqual(['b1v2', 'b1v3', 'b1v4']);
  });
  it('5. See all opens the viewer on the merged list; tapping a card opens the business profile', async () => {
    seedAll(); twoBiz(); wrapRoutes();
    await waitFor(() => expect(q('[data-fy-section="businesses"]')).not.toBeNull());
    fireEvent.click(q('[data-fy-section="businesses"] [data-fy-see-all]')!);
    expect(f.openWithOrigin).toHaveBeenCalled();
    const call = JSON.stringify(f.openWithOrigin.mock.calls.at(-1));
    ['b1v1', 'b2v1', 'b2v2', 'b1v2'].forEach(id => expect(call).toContain(id));
    fireEvent.click(q('[data-business-card="b2"]')!);
    await waitFor(() => expect(q('[data-biz-page]')).not.toBeNull());
  });
});
