// FIX_PROFILE_COMPARE_1: compare and form tiles open in place over another member's profile.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import type React from 'react';
const h = vi.hoisted(() => ({
  rpc: vi.fn(), viewer: 'viewer', resolve: vi.fn(), compareMounts: 0,
  hero: null as null | { onStatTap: (s: string) => void; onOpenRound?: (id: string) => void },
  sheet: null as null | { scoreId?: string | null; profileUserId?: string | null; onClose: () => void },
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'owner', deleted_at: null }, error: null }) }; return query;
} } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: h.viewer, is_anonymous: false }, loading: false }) }));
vi.mock('@/hooks/useUserProfile.tsx', () => ({ useUserProfile: () => ({ data: { id: 'owner', username: 'ellie', display_name: 'Ellie', user_type: 'personal', is_public: true, websites: [] }, isLoading: false, isError: false }) }));
vi.mock('@/components/friend-sheet/FriendSheetProvider', () => ({ useOpenFriendSheet: () => ({ open: vi.fn() }) }));
vi.mock('@/components/friend-sheet/useMemberTapResolver', () => ({ compareRouteFor: (id: string) => `/compare/${id}`, useMemberTapResolver: () => ({ resolve: h.resolve }) }));
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
vi.mock('@/components/profile/hero/ProfileHero', () => ({ ProfileHero: (p: NonNullable<typeof h.hero>) => { h.hero = p; return null; } }));
vi.mock('@/features/coach/BusinessCoachCards', () => ({ CoachProfileLine: () => null }));
vi.mock('@/components/profile/hero/ProfileTopTenRail', () => ({ ProfileTopTenRail: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => <div data-testid="profile-posts-content" /> }));
vi.mock('@/components/profile/handicap/whs/sections/compare/CompareMount', () => ({ default: () => { h.compareMounts++; return <div data-testid="compare-mount" />; } }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: (p: NonNullable<typeof h.sheet> & { open: boolean }) => { h.sheet = p; return p.open ? <div data-testid="round-sheet" data-score={p.scoreId ?? ''} data-owner={p.profileUserId ?? ''} /> : null; } }));
import ProfilePageV2 from '@/pages/ProfilePageV2';
import { Top100DebugProvider } from '@/context/Top100DebugContext';
import { compareBus } from '@/components/profile/handicap/whs/sections/compare/events';
import { HeroHandicapDisplay } from '@/components/profile/hero/HeroHandicapDisplay';

let emitSpy: ReturnType<typeof vi.spyOn>;
let goTo: (to: string) => void = () => {};
function PageLocation() {
  const location = useLocation(); const action = useNavigationType(); const navigate = useNavigate(); goTo = navigate;
  return <><output data-testid="page-location">{location.pathname}{location.search}</output><output data-testid="page-navigation">{action}</output></>;
}
function mountPage(path = '/profile/ellie') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><Top100DebugProvider><MemoryRouter initialEntries={[path]}><PageLocation /><Routes>
    <Route path="/profile" element={<ProfilePageV2 />} />
    <Route path="/profile/:username" element={<ProfilePageV2 />} />
    <Route path="/handicap" element={<div data-testid="own-handicap" />} />
  </Routes></MemoryRouter></Top100DebugProvider></QueryClientProvider>);
}
const loc = () => screen.getByTestId('page-location').textContent;
beforeEach(() => {
  vi.clearAllMocks(); h.viewer = 'viewer'; h.hero = null; h.sheet = null; h.compareMounts = 0;
  h.rpc.mockResolvedValue({ data: [], error: null });
  emitSpy = vi.spyOn(compareBus, 'emit');
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { emitSpy.mockRestore(); cleanup(); });

it("index on another member's profile emits compare in place, mounts one CompareMount and never navigates", async () => {
  mountPage();
  await waitFor(() => expect(h.hero).not.toBeNull());
  expect(screen.getAllByTestId('compare-mount')).toHaveLength(1);
  act(() => h.hero!.onStatTap('index'));
  expect(emitSpy).toHaveBeenCalledWith({ targetUserId: 'owner', from: 'profile' });
  expect(h.resolve).not.toHaveBeenCalled();
  expect(loc()).toBe('/profile/ellie');
  expect(screen.getByTestId('page-navigation')).toHaveTextContent('POP');
});

it("?tab=handicap on another member's profile strips the param with replace and opens compare in place", async () => {
  mountPage('/profile/ellie?tab=handicap');
  await waitFor(() => expect(emitSpy).toHaveBeenCalledWith({ targetUserId: 'owner', from: 'profile' }));
  await waitFor(() => expect(loc()).toBe('/profile/ellie'));
  expect(screen.getByTestId('page-navigation')).toHaveTextContent('REPLACE');
  expect(loc()).not.toContain('tab=handicap');
  expect(emitSpy).toHaveBeenCalledTimes(1);
});

it('switching from one profile to another resets the tab to the default', async () => {
  mountPage('/profile/ellie?tab=courses');
  await waitFor(() => expect(h.hero).not.toBeNull());
  expect(screen.queryByTestId('profile-posts-content')).toBeNull();
  act(() => goTo('/profile/sam'));
  await screen.findByTestId('profile-posts-content');
  expect(loc()).toBe('/profile/sam');
});

it("form tile opens RoundDetailSheet with that score and the profile's user id, a second tap closes it, nothing navigates", async () => {
  mountPage();
  await waitFor(() => expect(h.hero?.onOpenRound).toBeTypeOf('function'));
  act(() => h.hero!.onOpenRound!('score-1'));
  const sheet = await screen.findByTestId('round-sheet');
  expect(sheet.dataset.score).toBe('score-1');
  expect(sheet.dataset.owner).toBe('owner');
  act(() => h.hero!.onOpenRound!('score-1'));
  await waitFor(() => expect(screen.queryByTestId('round-sheet')).toBeNull());
  act(() => h.hero!.onOpenRound!('score-1'));
  await screen.findByTestId('round-sheet');
  act(() => h.sheet!.onClose());
  await waitFor(() => expect(screen.queryByTestId('round-sheet')).toBeNull());
  expect(loc()).toBe('/profile/ellie');
  expect(screen.getByTestId('page-navigation')).toHaveTextContent('POP');
});

it('own profile: index still goes to the own handicap surface', async () => {
  h.viewer = 'owner';
  mountPage('/profile');
  await waitFor(() => expect(h.hero).not.toBeNull());
  act(() => h.hero!.onStatTap('index'));
  await screen.findByTestId('own-handicap');
  expect(emitSpy).not.toHaveBeenCalled();
});

it('HeroHandicapDisplay form tile calls onOpenRound with the score id and never navigates', () => {
  const navigate = vi.fn(); const onOpenRound = vi.fn();
  const t = ((_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '') as unknown as React.ComponentProps<typeof HeroHandicapDisplay>['t'];
  const { container } = render(<MemoryRouter><HeroHandicapDisplay
    t={t} shownIndex={12.3} deltaLines={[]} slot={null} verdict={null} series={[12, 12.3]} chartColor="currentColor" chartFillTop={0.28}
    axisWindow="90 days" windowDays={90} bars={[{ id: 'score-9', value: 2 }] as React.ComponentProps<typeof HeroHandicapDisplay>['bars']}
    byId={new Map()} countingKnown={false} countingN={0} loweredN={0} tilesWord="one" isSelf={false}
    onStatTap={() => {}} tap={() => () => {}} navigate={navigate} onOpenRound={onOpenRound}
  /></MemoryRouter>);
  const buttons = container.querySelectorAll('button');
  fireEvent.click(buttons[buttons.length - 1]);
  expect(onOpenRound).toHaveBeenCalledWith('score-9');
  expect(navigate).not.toHaveBeenCalled();
});
