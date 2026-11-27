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
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}<span data-pro-label>PRO</span></> }));
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


import { orderCoaches } from '@/features/explore-magazine/watch/forYouRules';

describe('Brief 43 Coaching shows every verified coach', () => {
  it('a coach with no videos gets a card with 0 VIDEOS and Follow, after coaches with videos', async () => {
    seedAll(); f.watchPros = { data: [coach('c3', null), coach('c1', 'Wentworth Club'), coach('c2', null)], error: null };
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    const cards = Array.from(document.querySelectorAll('[data-fy-section="coaching"] [data-coach-card]'));
    expect(cards.map(c => c.getAttribute('data-coach-card'))).toEqual(['c1', 'c2', 'c3']);
    const c3 = cards[2];
    expect(c3.querySelector('[data-coach-count]')?.textContent).toBe('0');
    expect(c3.querySelector('[data-coach-count]')?.nextElementSibling?.textContent).toBe('Videos');
    expect(c3.querySelector('[data-coach-follow]')?.textContent).toBe('Follow');
  });
  it('no coach videos: heading and coach cards, no video rail', async () => {
    seedAll(); f.creatorVideos = {};
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    expect(screen.getByText('From the PGA pros')).toBeTruthy();
    expect(document.querySelectorAll('[data-fy-section="coaching"] [data-coach-card]')).toHaveLength(2);
    expect(q('[data-watch-rail="coaching"]')).toBeNull();
  });
  it('chip with no coach videos: coach cards and no grid', async () => {
    seedAll(); f.creatorVideos = {};
    wrap('coaching');
    await waitFor(() => expect(q('[data-fy-chip="coaching"]')).not.toBeNull());
    expect(document.querySelectorAll('[data-fy-chip="coaching"] [data-coach-card]')).toHaveLength(2);
    expect(q('[data-watch-grid="coaching"]')).toBeNull();
  });
  it('no section when get_watch_pros returns no coaches', async () => {
    seedAll(); f.watchPros = { data: [], error: null };
    wrap();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_watch_pros', { p_limit: 12 }));
    await waitFor(() => expect(q('[data-coaching-skeleton]')).toBeNull());
    expect(q('[data-fy-section="coaching"]')).toBeNull();
  });
  it('no section when get_watch_pros errors', async () => {
    seedAll(); f.watchPros = { data: null, error: { message: 'x' } };
    wrap();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_watch_pros', { p_limit: 12 }));
    await waitFor(() => expect(q('[data-coaching-skeleton]')).toBeNull());
    expect(q('[data-fy-section="coaching"]')).toBeNull();
  });
  it('coach cards carry no PRO label; coaching video tiles still do', async () => {
    seedAll();
    wrap();
    await waitFor(() => expect(q('[data-fy-section="coaching"]')).not.toBeNull());
    for (const card of Array.from(document.querySelectorAll('[data-coach-card]'))) expect(card.querySelector('[data-pro-label]')).toBeNull();
    const tiles = Array.from(document.querySelectorAll('[data-watch-rail="coaching"] [data-fy-post]'));
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) expect(tile.querySelector('[data-pro-label]')).not.toBeNull();
  });
  it('orders by latest video, then pro_verified_at for coaches with none', () => {
    const c = (id: string, verified: string | null) => ({ user_id: id, display_name: id, username: id, avatar_url: null, pro_body: 'PGA', pro_club: null, pro_verified_at: verified });
    const v = (id: string, days: number) => ({ ...cvid(id, 'x', days), post_created_at: ago(days) }) as never;
    const out = orderCoaches([
      { coach: c('none-old', ago(50)), videos: [] },
      { coach: c('vid-old', ago(1)), videos: [v('a', 9)] },
      { coach: c('none-new', ago(2)), videos: [] },
      { coach: c('vid-new', ago(90)), videos: [v('b', 1), v('c', 20)] },
      { coach: c('none-null', null), videos: [] },
    ]);
    expect(out.map(x => x.coach.user_id)).toEqual(['vid-new', 'vid-old', 'none-new', 'none-old', 'none-null']);
  });
});
