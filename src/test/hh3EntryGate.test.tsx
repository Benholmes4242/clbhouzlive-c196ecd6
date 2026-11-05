// HH3 §1 gate: the Compare entry row is page-eligible only for a signed-in, non-guest viewer on ANOTHER member's profile.
// Fixture copied whole from fixProfileCompare1.test.tsx; only the session mock reads h.anon.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import type React from 'react';
const h = vi.hoisted(() => ({
  rpc: vi.fn(), viewer: 'viewer', anon: false, resolve: vi.fn(), compareMounts: 0,
  hero: null as null | { onStatTap: (s: string) => void; onOpenRound?: (id: string) => void; showCompareEntry?: boolean },
  sheet: null as null | { scoreId?: string | null; profileUserId?: string | null; onClose: () => void },
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'owner', deleted_at: null }, error: null }) }; return query;
} } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: h.viewer, is_anonymous: h.anon }, loading: false }) }));
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

function mountPage(path = '/profile/ellie') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><Top100DebugProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/profile" element={<ProfilePageV2 />} />
    <Route path="/profile/:username" element={<ProfilePageV2 />} />
  </Routes></MemoryRouter></Top100DebugProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); h.viewer = 'viewer'; h.anon = false; h.hero = null; h.rpc.mockResolvedValue({ data: [], error: null }); Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

it("HH3: another member's profile, signed-in viewer: entry row enabled", async () => {
  mountPage();
  await waitFor(() => expect(h.hero).not.toBeNull());
  expect(h.hero!.showCompareEntry).toBe(true);
});
it('HH3: own profile: no entry row', async () => {
  h.viewer = 'owner';
  mountPage();
  await waitFor(() => expect(h.hero).not.toBeNull());
  expect(h.hero!.showCompareEntry).toBe(false);
});
it('HH3: guest viewer: no entry row', async () => {
  h.anon = true;
  mountPage();
  await waitFor(() => expect(h.hero).not.toBeNull());
  expect(h.hero!.showCompareEntry).toBe(false);
});
