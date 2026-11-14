import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, renderHook, within } from '@testing-library/react';
import { RAIL_CHIP_GEOMETRY } from '@/components/ui/RailChips';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import type React from 'react';
import { creatorTab, creatorDuration, useProfileCreator, type CreatorVideo, type RoundVideo } from '@/features/creator/profileCreator';
const h = vi.hoisted(() => ({ rpc: vi.fn(), open: vi.fn(), track: vi.fn(), anonymous: false, posts: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: () => {
 const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'owner', deleted_at: null }, error: null }) }; return query;
} } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: h.open }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { ProfileVideosTab } from '@/features/creator/ProfileVideosTab';
import { ProfileRoundVideos, RoundVideoPill } from '@/features/creator/ProfileRoundVideos';
// Whole-page cases retain the real creator query, tab bodies, chip navigation and
// router. Unrelated profile data and heavy hero/modal surfaces are isolated.
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer', is_anonymous: h.anonymous }, loading: false }) }));
vi.mock('@/hooks/useUserProfile.tsx', () => ({ useUserProfile: () => ({ data: { id: 'owner', username: 'ellie', display_name: 'Ellie', user_type: 'personal', is_public: true, websites: [] }, isLoading: false, isError: false }) }));
vi.mock('@/components/friend-sheet/FriendSheetProvider', () => ({ useOpenFriendSheet: () => ({ open: vi.fn() }) }));
vi.mock('@/components/friend-sheet/useMemberTapResolver', () => ({ compareRouteFor: (id: string) => `/compare/${id}`, useMemberTapResolver: () => ({ resolve: vi.fn() }) }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {} }));
vi.mock('@/hooks/usePersonalPostsCount', () => ({ usePersonalPostsCount: () => ({ data: 0 }) }));
vi.mock('@/hooks/usePersonalReviewsCount', () => ({ usePersonalReviewsCount: () => ({ data: 0, isFetched: true, isError: false }) }));
vi.mock('@/hooks/useProfileAchievements', () => ({ useProfileAchievements: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/messaging/useStartConversation', () => ({ useStartConversation: () => ({ start: vi.fn(), isStarting: false }) }));
vi.mock('@/hooks/useFriendship', () => ({ useFriendship: () => ({ status: 'none', isUpdating: false, sendRequest: vi.fn(), cancelRequest: vi.fn(), acceptRequest: vi.fn(), declineRequest: vi.fn(), unfriend: vi.fn() }) }));
vi.mock('@/hooks/useSocialCounts', () => ({ useSocialCounts: () => ({ data: {}, isFetched: true, isError: false }) }));
vi.mock('@/hooks/useRealtimeSocialCounts', () => ({ useRealtimeSocialCounts: () => {} }));
vi.mock('@/hooks/useBlockActions', () => ({ useBlockActions: () => ({ blockUser: vi.fn() }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useMyBusinesses: () => ({ data: [] }) }));
vi.mock('@/hooks/useUserCourseSummary', () => ({ useUserCourseSummary: () => ({ totalCoursesPlayed: 0, isCoursesError: false }) }));
vi.mock('@/hooks/profile/useMemberRoundTotal', () => ({ useMemberRoundTotal: () => ({ total: 0, state: 'ok' }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({ useProfileRoundsCount: () => ({ data: 0 }), useProfileRounds: () => ({ data: [], isSuccess: true }), isFullEighteen: () => false }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null, secondaryClubs: [], isLoading: true }) }));
vi.mock('@/features/home-club/useHomeClubStatus', () => ({ useHomeClubStatus: () => ({ isLoading: true }) }));
vi.mock('@/components/profile/hero/ProfileHero', () => ({ ProfileHero: () => null }));
vi.mock('@/features/coach/BusinessCoachCards', () => ({ CoachProfileLine: () => null }));
vi.mock('@/components/profile/hero/ProfileTopTenRail', () => ({ ProfileTopTenRail: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => { h.posts(); return <div data-testid="profile-posts-content" />; } }));
import ProfilePageV2 from '@/pages/ProfilePageV2';
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
const video = (id: string) => ({ post_id: id, actor_id: 'owner', actor_type: 'personal', created_at: '2026-10-30T12:00:00Z', caption: 'Golf', display_name: 'Ellie', handle: 'ellie', avatar_url: '', is_verified: false, poster_url: '', stream_id: 'abc', duration_seconds: 542, media_url: 'stream:abc', hls_url: '', course_id: 'course', course_name: 'Walton Heath Golf Club', height: 1000, width: 600, like_count: 0, region: '' } as CreatorVideo);
const summary = { is_creator: true, videos: 2, shorts: 0, long_form: 2 };
beforeEach(() => { vi.clearAllMocks(); h.anonymous = false; h.rpc.mockResolvedValue({ data: [], error: null }); });
afterEach(cleanup);
it('creator label is present only when enabled and is a sibling of the name', () => {
 const { rerender } = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} />, { wrapper });
 expect(document.querySelector('.profile-creator-label')).toBeNull();
 rerender(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} isCreator />);
 const badges = document.querySelector('.identity-badges');
 expect(badges?.previousElementSibling).toBe(screen.getByRole('heading', { name: 'Ellie' }));
 expect(badges?.children).toHaveLength(1);
 expect(badges?.children[0].className).toBe('profile-creator-label');
});
it('creator defaults to Videos while a non-creator defaults to Posts', () => { expect(creatorTab(null, true, false)).toBe('videos'); expect(creatorTab(null, false, false)).toBe('activity'); });
it('non-creator video links resolve to Posts', () => { expect(creatorTab('videos', false, false)).toBe('activity'); });
it('no implicit Posts content is selected during creator loading', () => { expect(creatorTab(null, false, true)).toBeNull(); expect(creatorTab('courses', false, true)).toBe('courses'); });
it('creator summary never reads when signed out', () => { renderHook(() => useProfileCreator('owner', false), { wrapper }); expect(h.rpc).not.toHaveBeenCalled(); });
it('chips switch the server kind and tiles open the loaded list at the tapped index', async () => {
 h.rpc.mockResolvedValue({ data: [video('a'), video('b')], error: null }); render(<ProfileVideosTab userId="owner" viewerId="viewer" summary={summary} />, { wrapper });
 fireEvent.click(await screen.findByRole('button', { name: 'Play video 2' })); expect(h.open).toHaveBeenCalledWith(expect.objectContaining({ index: 1, posts: expect.arrayContaining([expect.objectContaining({ id: 'b' })]) }));
 fireEvent.click(screen.getByRole('tab', { name: 'Shorts 0' })); await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_profile_videos', { p_user_id: 'owner', p_kind: 'short', p_limit: 30 }));
});
it('creator Videos renders three counted RailChips centred with the shared sm geometry', () => {
 render(<ProfileVideosTab userId="owner" viewerId="viewer" summary={{ is_creator: true, videos: 26, shorts: 25, long_form: 1 }} />, { wrapper });
 const row = screen.getByRole('tablist', { name: 'Video type' });
 const chips = within(row).getAllByRole('tab');
 expect(chips).toHaveLength(3);
 expect(within(row).getByRole('tab', { name: 'All 26' })).toHaveAttribute('aria-selected', 'true');
 expect(within(row).getByRole('tab', { name: 'Shorts 25' })).toHaveAttribute('aria-selected', 'false');
 expect(within(row).getByRole('tab', { name: 'Long form 1' })).toHaveAttribute('aria-selected', 'false');
 expect(row.style.justifyContent).toBe('safe center');
 for (const chip of chips) {
  expect(chip.style.padding).toBe(RAIL_CHIP_GEOMETRY.sm.padding);
  expect(chip.style.fontSize).toBe(`${RAIL_CHIP_GEOMETRY.sm.fontSize}px`);
 }
});
it('Long form filters the creator grid and tracks the unchanged chip event', async () => {
 h.rpc.mockImplementation((_name: string, args: { p_kind?: string }) => Promise.resolve({ data: [video(args.p_kind === 'long' ? 'long-only' : 'all-only')], error: null }));
 render(<ProfileVideosTab userId="owner" viewerId="viewer" summary={summary} />, { wrapper });
 await screen.findByRole('button', { name: 'Play video 1' });
 fireEvent.click(screen.getByRole('tab', { name: 'Long form 2' }));
 await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_profile_videos', { p_user_id: 'owner', p_kind: 'long', p_limit: 30 }));
 expect(h.track).toHaveBeenCalledWith('profile_videos_chip_changed', { kind: 'long' });
 await screen.findByRole('button', { name: 'Play video 1' });
 fireEvent.click(screen.getByRole('button', { name: 'Play video 1' }));
 expect(h.open).toHaveBeenCalledWith(expect.objectContaining({ posts: [expect.objectContaining({ id: 'long-only' })] }));
});
it('round pill uses m:ss or N videos and isolates the scorecard tap', () => {
 const scorecard = vi.fn(); const rows = [{ ...video('a'), score_id: 'score' }] as RoundVideo[];
 const { rerender } = render(<div onClick={scorecard}><RoundVideoPill rows={rows} self={false} /></div>, { wrapper });
 fireEvent.click(screen.getByRole('button', { name: '9:02' })); expect(scorecard).not.toHaveBeenCalled(); expect(h.open).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
 rerender(<RoundVideoPill rows={[...rows, { ...video('b'), score_id: 'score' }]} self={false} />); expect(screen.getByRole('button', { name: '2 videos' })).toBeInTheDocument(); expect(creatorDuration(3601)).toBe('60:01');
});
it('round video collector does not read without a signed-in viewer', () => {
 render(<ProfileRoundVideos userId="owner" rounds={[]}>{() => null}</ProfileRoundVideos>, { wrapper }); expect(h.rpc).not.toHaveBeenCalled();
});
function PageLocation() {
 const location = useLocation(); const action = useNavigationType(); const navigate = useNavigate();
 return <><output data-testid="page-location">{location.pathname}{location.search}</output><output data-testid="page-navigation">{action}</output><button onClick={() => navigate(-1)}>Test back</button></>;
}
function mountPage(path = '/profile/ellie') {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
 const result = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/before', path]} initialIndex={1}><PageLocation /><Routes><Route path="/profile/:username" element={<ProfilePageV2 />} /><Route path="/before" element={<div data-testid="before-page" />} /></Routes></MemoryRouter></QueryClientProvider>);
 return { ...result, client };
}
it('anonymous whole-page default shows Posts without a creator skeleton or creator read', async () => {
 h.anonymous = true;
 const { container, client } = mountPage();
 await screen.findByTestId('profile-posts-content');
 expect(container.querySelector('.profile-video-grid[aria-busy="true"]')).toBeNull();
 expect(h.rpc.mock.calls.filter(([name]) => name === 'get_profile_creator')).toHaveLength(0);
 expect(client.getQueryState(['profile-creator', 'owner'])?.fetchStatus).toBe('idle');
 expect(screen.queryByRole('button', { name: 'Videos' })).toBeNull();
});
it('signed-in whole-page creator default waits in the skeleton then shows Videos without Posts flashing', async () => {
 let resolveCreator: ((value: { data: typeof summary[]; error: null }) => void) | undefined;
 const pending = new Promise<{ data: typeof summary[]; error: null }>(resolve => { resolveCreator = resolve; });
 h.rpc.mockImplementation((name: string) => name === 'get_profile_creator' ? pending : Promise.resolve({ data: [], error: null }));
 const { container } = mountPage();
 await waitFor(() => expect(container.querySelector('.profile-video-grid[aria-busy="true"]')).not.toBeNull());
 expect(h.posts).not.toHaveBeenCalled();
 expect(screen.queryByTestId('profile-posts-content')).toBeNull();
 expect(h.rpc).toHaveBeenCalledWith('get_profile_creator', { p_user_id: 'owner' });
 if (!resolveCreator) throw new Error('Creator resolver was not installed');
 resolveCreator({ data: [summary], error: null });
 await waitFor(() => expect(container.querySelector('.profile-videos')).not.toBeNull());
 expect(h.posts).not.toHaveBeenCalled();
 expect(container.querySelector('.profile-video-grid[aria-busy="true"]')).toBeNull();
});
it('signed-in whole-page non-creator defaults to Posts and replaces a Videos deep link with Posts', async () => {
 const originalScrollIntoView = Element.prototype.scrollIntoView;
 Element.prototype.scrollIntoView = vi.fn();
 try {
 h.rpc.mockImplementation(() => Promise.resolve({ data: [{ ...summary, is_creator: false }], error: null }));
 const first = mountPage();
 await screen.findByTestId('profile-posts-content');
 expect(screen.queryByRole('button', { name: 'Videos' })).toBeNull();
 expect(h.rpc).toHaveBeenCalledWith('get_profile_creator', { p_user_id: 'owner' });
 first.unmount(); first.client.clear();
 mountPage('/profile/ellie?tab=videos');
 await screen.findByTestId('profile-posts-content');
 await waitFor(() => expect(screen.getByTestId('page-location')).toHaveTextContent('/profile/ellie?tab=activity'));
 expect(screen.getByTestId('page-navigation')).toHaveTextContent('REPLACE');
 fireEvent.click(screen.getByRole('button', { name: 'Test back' }));
 await screen.findByTestId('before-page');
 expect(screen.getByTestId('page-location')).toHaveTextContent('/before');
 } finally {
  cleanup();
  Element.prototype.scrollIntoView = originalScrollIntoView;
 }
});
