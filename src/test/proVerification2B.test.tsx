import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ rpc: vi.fn(), people: [] as any[], businesses: [] as any[], requests: [] as any[], rounds: [] as any[], club: [] as any[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/features/chrome-v2/useIslandBackName', () => ({ useIslandBackName: () => {} }));
vi.mock('@/features/chrome-v2/IslandDock', () => ({ IslandDock: () => null }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({ usePeopleSuggestions: () => ({ data: h.people, isLoading: false }), useBusinessSuggestions: () => ({ data: h.businesses, isLoading: false }) }));
vi.mock('@/features/find-people/useRecentActivity', () => ({ useRecentActivity: () => new Map() }));
vi.mock('@/features/find-people/useSuggestionCovers', () => ({ useSuggestionCovers: () => new Map(), useSuggestionCoversQuery: () => ({ covers: new Map(), settled: true }) }));
vi.mock('@/features/find-people/useFollowTileMedia', () => ({ useFollowTileMedia: () => ({ media: new Map(), settled: true }) }));
vi.mock('@/features/social-suggestions/useSuggestedGolfers', () => ({ useSuggestionGate: () => ({ eligible: true }), useSuggestedGolfers: () => ({ data: [], isFetched: true }) }));
vi.mock('@/features/social-lists-v2/rowParts', () => ({ RowAvatar: () => <span data-avatar />, FollowButton: () => <span data-follow />, ROW_FONT: 'inherit' }));
vi.mock('@/features/search-v2/hooks/useGlobalSearchV2', () => ({ useGlobalSearchV2: () => ({ data: { people: [], clubs: [] }, isLoading: false }) }));
vi.mock('@/features/activity-v2/hooks/useFriendRequestsV2', () => ({ useFriendRequestsV2: () => ({ data: h.requests, isLoading: false, acceptRequest: { isPending: false }, declineRequest: { isPending: false } }) }));
vi.mock('@/hooks/gam/useCircleLatestRounds', () => ({ useCircleLatestRounds: () => ({ data: h.rounds, isLoading: false, isFetched: true }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useCourseCardMeta', () => ({ useCourseCardMeta: () => ({ data: new Map(), isLoading: false, isFetched: true }) }));
vi.mock('@/components/courses/browse/PageLoadGate', async original => ({ ...await original<typeof import('@/components/courses/browse/PageLoadGate')>(), useSectionReady: () => {} }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/features/explore-magazine/useClubGolfers', () => ({ useClubGolfers: () => ({ golfers: h.club, isFetched: true }) }));
vi.mock('@/features/explore-magazine/ExploreShelf', () => ({ ExploreShelf: ({ children }: any) => <section>{children}</section> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-avatar /> }));
vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({ PlayerAvatar: () => <span data-player-avatar /> }));
vi.mock('@/video/useRailLane', () => ({ useRailLane: () => ({ hostRef: null, ready: false }) }));
vi.mock('@/video/usePreroutePrefetch', () => ({ usePreroutePrefetch: () => ({}) }));
import { WhoToFollowRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import FindPeoplePage from '@/pages/FindPeoplePage';
import { SuggestedGolfersBlock } from '@/features/social-suggestions/SuggestedGolfersBlock';
import { SuggestedGolferRow } from '@/features/social-suggestions/SuggestedGolferRow';
import { FriendRequestsRail } from '@/features/activity-v2/components/FriendRequestsRail';
import { WhoPlayingSection } from '@/components/courses/browse/WhoPlayingSection';
import { TournamentPicksBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/TournamentPicksBoard';
import { PeopleShelf } from '@/features/explore-magazine/PeopleShelf';
import { FeedCard } from '@/components/feed-cards/FeedCard';
import { invalidateProMembers } from '@/features/pro-verification/proMembersCache';

// The batched read's id order is not part of the contract; compare as a set.
const proReadIds = (): string[] | undefined => {
  const call = h.rpc.mock.calls.find(c => c[0] === 'get_pro_members');
  return call ? call[1]?.p_user_ids as string[] : undefined;
};
const ids = ['pro', 'ordinary', 'pending'];
const SIBLING_SURFACES = ['rail', 'find people'];
const getByTextIn = (root: HTMLElement, text: string) => within(root).getByText(text, { selector: 'span' });
const person = (id: string) => ({ user_id: id, display_name: id, username: id, profile_photo_url: null, reason_type: 'club', reason_club_name: 'Club', reason_course_name: null, reason_date: null, mutual_count: null, recent_rounds: null, rounds_total: 3, handicap_index: null, is_verified: false });
function gridCard(id: string, actorType: 'personal' | 'business' = 'personal') {
  const post = { id, userId: id, actorId: id, actorType, mediaItems: [] } as any;
  return <FeedCard key={id} row={{ post_id: id, creator_display_name: id, creator_username: id, post_content: '', derived_format: 'clip', poster_url: null, duration_seconds: null, like_count: 0, course_name: null }} feedPost={post} posts={[post]} flatIndex={0} isAutoplayActive={false} openedFrom="explore" />;
}
function surface(name: string) {
  switch (name) {
    case 'rail': return <WhoToFollowRail slot={1} />;
    case 'find people': return <FindPeoplePage />;
    case 'suggested block': return <SuggestedGolfersBlock />;
    case 'suggested row': return <>{ids.map(id => <SuggestedGolferRow key={id} golfer={person(id) as any} />)}</>;
    case 'friend requests': return <FriendRequestsRail />;
    case 'course members': return <WhoPlayingSection />;
    case 'picks members': return <TournamentPicksBoard rows={ids.map(id => ({ user_id: id, display_name: id, username: id, profile_photo_url: null, player_id: 'player', player_name: 'Tour Player', is_viewer: false, is_followed: false }))} field={[]} ourPicks={[]} tourCode="pga" pending={false} failed={false} retry={() => {}} />;
    case 'people shelf': return <PeopleShelf viewerId="viewer" clubId="club" clubName="Club" enabled pos={1} />;
    default: return <>{ids.map(id => gridCard(id))}</>;
  }
}
function mount(children: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/find-people?tab=golferstofollow']}>{children}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  invalidateProMembers(); resetWhoToFollowRailSessionForTests();
  h.rpc.mockReset().mockResolvedValue({ data: [{ user_id: 'pro', pro_kind: 'tour_pro' }], error: null });
  h.people = ids.map(person); h.businesses = [];
  h.requests = ids.map(id => ({ request_id: id, requester_user_id: id, requester_display_name: id, requester_username: id, mutual_friend_count: 0 }));
  h.rounds = ids.map((id, i) => ({ round_id: id, user_id: id, display_name: id, course_id: i < 2 ? 'course' : 'other', course_name: 'Course', play_date: '2026-11-04', gross: null }));
  h.club = ids.map(id => ({ userId: id, name: id, username: id, photoUrl: null, recordCategories: [], roundsHere: 1, isNew: false }));
});
afterEach(cleanup);
describe('Brief 2B mounted member names', () => {
  for (const name of ['rail', 'find people', 'suggested block', 'suggested row', 'friend requests', 'course members', 'picks members', 'people shelf', 'grid card']) {
    it(`${name}: verified-only labels with one batched screen read`, async () => {
      const { container } = mount(surface(name));
      await waitFor(() => expect(container.querySelectorAll('.pro-label')).toHaveLength(1));
      expect(h.rpc.mock.calls.filter((c: unknown[]) => c[0] !== 'get_people_to_follow_by_kind')).toHaveLength(1);
      expect(proReadIds()?.sort()).toEqual([...ids].sort());
      if (SIBLING_SURFACES.includes(name)) {
        expect(container.querySelector('.pro-label')?.previousElementSibling?.textContent).toBe('pro');
        expect(container.querySelector('.pro-inline-name')).toBeNull();
        return;
      }
      const labelled = container.querySelector('.pro-inline-name:has(.pro-label)');
      expect(labelled?.querySelector('.pro-inline-text')?.textContent).toBe('pro');
      expect([...container.querySelectorAll('.pro-inline-name')].filter(node => node.querySelector('.pro-inline-text')?.textContent !== 'pro').every(node => !node.querySelector('.pro-label'))).toBe(true);
    });
  }
  it('business grid names never enter the pro read', () => {
    const { container } = mount(gridCard('pro', 'business'));
    expect(container.querySelector('.pro-label')).toBeNull();
    expect(h.rpc).not.toHaveBeenCalled();
  });
  it('centred shelf name stays in the original second child with unchanged sibling reservations', async () => {
    const { container } = mount(surface('people shelf'));
    const tile = container.querySelector('.pro-inline-name')?.parentElement?.parentElement;
    const children = tile ? [...tile.children] : [];
    expect(children.map(child => child.tagName)).toEqual(['SPAN', 'SPAN', 'SPAN', 'BUTTON']);
    await waitFor(() => expect(container.querySelector('.pro-label')).not.toBeNull());
    expect(tile ? [...tile.children] : []).toEqual(children);
    expect(children[1]?.querySelector('.pro-label')).not.toBeNull();
  });
  it('mixed follow rail labels members but never businesses', async () => {
    h.businesses = [{ business_id: 'business', name: 'Business', category: 'Golf Club', reason_type: 'your_club', is_verified: true }];
    const { container } = mount(surface('rail'));
    await waitFor(() => expect(container.querySelectorAll('.pro-label')).toHaveLength(1));
    expect(h.rpc.mock.calls.filter((c: unknown[]) => c[0] !== 'get_people_to_follow_by_kind')).toHaveLength(1);
    expect(proReadIds()?.sort()).toEqual([...ids].sort());
    expect(getByTextIn(container, 'Business').parentElement?.querySelector('.pro-label')).toBeNull();
  });
  for (const name of SIBLING_SURFACES) {
    it(`${name}: verified non-pro keeps the tick in the name's parent`, async () => {
      h.people = ids.map(id => ({ ...person(id), is_verified: id === 'ordinary' }));
      const { container } = mount(surface(name));
      await waitFor(() => expect(container.querySelector('.pro-label')).not.toBeNull());
      expect(getByTextIn(container, 'ordinary').parentElement?.querySelector('svg.lucide-badge-check')).not.toBeNull();
    });
    it(`${name}: verified pro shows PRO and no tick`, async () => {
      h.people = ids.map(id => ({ ...person(id), is_verified: id === 'pro' }));
      const { container } = mount(surface(name));
      await waitFor(() => expect(container.querySelector('.pro-label')).not.toBeNull());
      const parent = getByTextIn(container, 'pro').parentElement;
      expect(parent?.querySelector('.pro-label')).not.toBeNull();
      expect(parent?.querySelector('svg.lucide-badge-check')).toBeNull();
    });
    it(`${name}: name element is unchanged`, async () => {
      const { container } = mount(surface(name));
      await waitFor(() => expect(container.querySelector('.pro-label')).not.toBeNull());
      const el = getByTextIn(container, 'pro');
      expect(el.tagName).toBe('SPAN');
      expect(el.children).toHaveLength(0);
      expect(el.getAttribute('style')).toBe('overflow: hidden; text-overflow: ellipsis;');
      expect(el.nextElementSibling?.classList.contains('pro-label')).toBe(true);
    });
  }
});