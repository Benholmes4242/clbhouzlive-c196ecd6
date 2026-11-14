// BRIEF_PRO_RESULTS_SWITCH_UI — page-level deep link: ?tab=tour must wait for
// the pro_results_visible read to settle before the tour → activity redirect
// runs. Fixture pattern copied whole from hh3EntryGate.test.tsx; only the rpc
// routing and pro stubs are new.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  deferred: null as null | ((v: unknown) => void),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'owner', deleted_at: null }, error: null }) }; return query;
} } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer', is_anonymous: false }, loading: false }) }));
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
vi.mock('@/features/pro-profile/ProProfileBuildOne', () => ({ ProProfileBuildOne: () => <div data-testid="pro-hero" /> }));
vi.mock('@/features/pro-verification/ProfileTourTab', () => ({ ProfileTourTab: () => <div data-testid="tour-tab" /> }));
vi.mock('@/features/coach/BusinessCoachCards', () => ({ CoachProfileLine: () => null }));
vi.mock('@/components/profile/hero/ProfileTopTenRail', () => ({ ProfileTopTenRail: () => null }));
vi.mock('@/components/shared/AvatarLightbox', () => ({ AvatarLightbox: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/posts-tab/PostsTabContent', () => ({ default: () => <div data-testid="profile-posts-content" /> }));
vi.mock('@/components/profile/handicap/whs/sections/compare/CompareMount', () => ({ default: () => null }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));

import ProfilePageV2 from '@/pages/ProfilePageV2';
import { Top100DebugProvider } from '@/context/Top100DebugContext';

const tourPro = { user_id: 'owner', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: 'alps', pro_club: null, pro_player_id: 'player' };

function Location() {
  const l = useLocation();
  return <div data-testid="location" data-search={l.search} />;
}

function mountPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><Top100DebugProvider><MemoryRouter initialEntries={['/profile/ellie?tab=tour']}><Routes>
    <Route path="/profile/:username" element={<><ProfilePageV2 /><Location /></>} />
  </Routes></MemoryRouter></Top100DebugProvider></QueryClientProvider>);
}

beforeEach(() => {
  h.deferred = null;
  h.rpc.mockClear();
  h.rpc.mockImplementation((name: string) => {
    if (name === 'get_pro_members') return Promise.resolve({ data: [tourPro], error: null });
    if (name === 'pro_results_visible') return new Promise(res => { h.deferred = res; });
    return Promise.resolve({ data: [], error: null });
  });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('Pro results switch — Tour tab deep link', () => {
  it('waits for the visibility read, then redirects to activity when results are hidden', async () => {
    mountPage();
    await waitFor(() => expect(screen.getByTestId('pro-hero')).toBeInTheDocument());
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('pro_results_visible', { p_user: 'owner' }));
    // Still in flight: the deep link must not be bounced yet.
    await new Promise(res => setTimeout(res, 50));
    expect(screen.getByTestId('location').dataset.search).toBe('?tab=tour');
    h.deferred!({ data: false, error: null });
    await waitFor(() => expect(screen.getByTestId('location').dataset.search).toBe('?tab=activity'));
    expect(screen.queryByTestId('tour-tab')).toBeNull();
  });

  it('keeps the Tour tab when results are visible', async () => {
    mountPage();
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('pro_results_visible', { p_user: 'owner' }));
    h.deferred!({ data: true, error: null });
    await waitFor(() => expect(screen.getByTestId('tour-tab')).toBeInTheDocument());
    expect(screen.getByTestId('location').dataset.search).toBe('?tab=tour');
  });
});
