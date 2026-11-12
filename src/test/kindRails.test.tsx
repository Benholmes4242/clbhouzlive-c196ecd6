/**
 * Pros to follow / Creators to follow rails (wtf-pros-creators-rails, Option A).
 * The i18n mock returns defaultValue uninterpolated, so copy is asserted on the
 * pure rules' Copy descriptors; rendered assertions target structure.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string; is_anonymous?: boolean } | null,
  people: [] as unknown[],
  kind: { pro: [] as unknown[], creator: [] as unknown[] } as Record<string, unknown[]>,
  activity: [] as unknown[],
  rpc: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: h.from } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: h.toggle, isPending: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({
  usePeopleSuggestions: () => ({ data: h.people, isLoading: false, isError: false }),
  useBusinessSuggestions: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock('@/features/search-v2/hooks/useGlobalSearchV2', () => ({
  useGlobalSearchV2: () => ({
    data: { people: [], clubs: [], courses: [], players: [], videos: [], posts: [] },
    isLoading: false, error: null, debouncedQuery: '', refetch: () => {},
  }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import {
  kindFigures, kindRailForPostIndex, kindReason, railSlotForPostIndex, type KindPerson,
} from '@/features/find-people/railRules';
import { KindRail, WhoToFollowRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import { invalidateProMembers } from '@/features/pro-verification/proMembersCache';
import FindPeoplePage from '@/pages/FindPeoplePage';
import { InviteSheetContext } from '@/components/invite/InviteSheetProvider';
import type { PersonSuggestion } from '@/features/find-people/findPeopleRules';

const row = (o: Partial<KindPerson>): KindPerson => ({
  user_id: 'k1', display_name: 'Kim', username: 'kim', profile_photo_url: null,
  pro_kind: null, pro_tour: null, pro_club: null, videos: null, mutual_count: null, followers: null, ...o,
});
const person = (o: Partial<PersonSuggestion>): PersonSuggestion => ({
  user_id: 'u', display_name: 'U', username: 'u', profile_photo_url: null, reason_type: 'popular',
  reason_club_name: null, reason_course_name: null, reason_date: null, mutual_count: null,
  recent_rounds: null, rounds_total: 5, handicap_index: null, is_verified: false, ...o,
});
const pros = ['Pat One', 'Pat Two', 'Pat Three'].map((n, i) => row({ user_id: `pro${i}`, display_name: n, pro_kind: 'tour_pro', pro_tour: 'DP World Tour', followers: 10 }));
const creators = ['Cara One', 'Cara Two', 'Cara Three'].map((n, i) => row({ user_id: `cr${i}`, display_name: n, videos: 4, followers: 3 }));

function Probe() {
  const loc = useLocation();
  return <div data-testid="probe">{loc.pathname + loc.search}</div>;
}
function wrap(ui: React.ReactNode, initial = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const path = initial.split('?')[0];
  return render(
    <QueryClientProvider client={qc}>
      <InviteSheetContext.Provider value={{ openInviteSheet: () => {}, closeInviteSheet: () => {} }}>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </InviteSheetContext.Provider>
    </QueryClientProvider>,
  );
}
const kindCalls = () => h.rpc.mock.calls.filter((c) => c[0] === 'get_people_to_follow_by_kind');

beforeEach(() => {
  resetWhoToFollowRailSessionForTests();
  invalidateProMembers();
  h.user = { id: 'viewer' };
  h.people = [];
  h.kind = { pro: pros, creator: creators };
  h.activity = [];
  h.insert.mockReset().mockResolvedValue({ error: null });
  h.from.mockReset().mockImplementation(() => ({ insert: h.insert }));
  h.toggle.mockReset().mockResolvedValue(undefined);
  h.rpc.mockReset().mockImplementation((fn: string, args: Record<string, unknown>) => {
    if (fn === 'get_people_to_follow_by_kind') return Promise.resolve({ data: h.kind[args.p_kind as string], error: null });
    if (fn === 'get_recent_activity') return Promise.resolve({ data: h.activity, error: null });
    if (fn === 'get_pro_members') return Promise.resolve({ data: pros.map((p) => ({ user_id: p.user_id, pro_kind: 'tour_pro' })), error: null });
    return Promise.resolve({ data: [], error: null });
  });
});
afterEach(cleanup);

describe('kind rail placement', () => {
  it('pros sit above post 9 and creators above post 21; slots 1 and 2 unchanged', () => {
    expect(kindRailForPostIndex(9, 30)).toBe('pro');
    expect(kindRailForPostIndex(21, 30)).toBe('creator');
    expect(kindRailForPostIndex(3, 30)).toBeNull();
    expect(kindRailForPostIndex(15, 30)).toBeNull();
    expect(kindRailForPostIndex(21, 21)).toBeNull();
    expect(railSlotForPostIndex(3, 30)).toBe(1);
    expect(railSlotForPostIndex(15, 30)).toBe(2);
    expect(railSlotForPostIndex(9, 30)).toBeNull();
  });
  it('a kind rail with 3 cards renders; with 2 it renders nothing', async () => {
    const { unmount } = wrap(<KindRail kind="pro" />);
    expect(await screen.findByTestId('pros-to-follow-rail')).toBeTruthy();
    unmount();
    h.kind.creator = creators.slice(0, 2);
    wrap(<KindRail kind="creator" />);
    await waitFor(() => expect(kindCalls().length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId('creators-to-follow-rail')).toBeNull();
  });
  it('the RPC is called with the kind and p_limit 12', async () => {
    wrap(<KindRail kind="creator" />);
    await screen.findByTestId('creators-to-follow-rail');
    expect(kindCalls()[0][1]).toEqual({ p_kind: 'creator', p_limit: 12 });
  });
});

describe('kind card copy', () => {
  it('teaching pro reads with club; tour pro with tour; null drops the separator', () => {
    expect(kindReason('pro', row({ pro_kind: 'teaching_pro', pro_club: 'Wentworth' }))).toMatchObject({ def: 'Teaching professional · {{club}}', vars: { club: 'Wentworth' } });
    expect(kindReason('pro', row({ pro_kind: 'tour_pro', pro_tour: 'PGA Tour' }))).toMatchObject({ def: 'Tour professional · {{tour}}', vars: { tour: 'PGA Tour' } });
    expect(kindReason('pro', row({ pro_kind: 'teaching_pro' })).def).toBe('Teaching professional');
    expect(kindReason('pro', row({ pro_kind: 'tour_pro' })).def).toBe('Tour professional');
  });
  it('creator reads one video or N videos', () => {
    expect(kindReason('creator', row({ videos: 1 })).def).toBe('Creator · 1 video');
    expect(kindReason('creator', row({ videos: 24 }))).toMatchObject({ def: 'Creator · {{count}} videos', vars: { count: 24 } });
  });
  it('slot fallback: mutuals, then followers, then nothing', () => {
    expect(kindFigures(row({ mutual_count: 2, followers: 9 }))).toMatchObject({ def: 'Followed by {{count}} you follow', vars: { count: 2 } });
    expect(kindFigures(row({ followers: 9 }))).toMatchObject({ def: '{{count}} followers', vars: { count: '9' } });
    expect(kindFigures(row({ followers: 1 }))?.def).toBe('1 follower');
    expect(kindFigures(row({}))).toBeNull();
  });
  it('the slot shows amber activity first, else figures, else stays empty', async () => {
    h.kind.pro = [
      row({ user_id: 'a', display_name: 'Active Al', mutual_count: 3 }),
      row({ user_id: 'b', display_name: 'Mutual Mo', mutual_count: 3 }),
      row({ user_id: 'c', display_name: 'Empty Ed' }),
    ];
    h.activity = [{ actor_id: 'a', kind: 'post', post_id: 'p1', created_at: new Date().toISOString(), course_name: null }];
    wrap(<KindRail kind="pro" />);
    const cardOf = (n: string) => screen.getByText(n).closest('[role="button"]') as HTMLElement;
    await screen.findByText('Active Al');
    await waitFor(() => expect(cardOf('Active Al').querySelector('[data-testid="rail-when"]')).not.toBeNull());
    expect(cardOf('Active Al').querySelector('[data-testid="rail-figures"]')).toBeNull();
    expect(cardOf('Mutual Mo').querySelector('[data-testid="rail-figures"]')?.textContent).toBe('Followed by {{count}} you follow');
    const empty = cardOf('Empty Ed').querySelector('[data-testid="rail-slot"]') as HTMLElement;
    expect(empty.textContent).toBe('');
    expect(empty.style.height).toBe('35px');
  });
  it('pro cards carry the PRO label and no card has a Creator chip', async () => {
    const { container, unmount } = wrap(<KindRail kind="pro" />);
    await waitFor(() => expect(container.querySelectorAll('.pro-label')).toHaveLength(3));
    unmount();
    const c = wrap(<KindRail kind="creator" />);
    await screen.findByTestId('creators-to-follow-rail');
    expect(c.container.querySelector('.pro-label')).toBeNull();
    expect(c.container.textContent).not.toMatch(/CREATOR(?! ·)/);
  });
});

describe('no one twice', () => {
  it('the general rail leaves out people shown in a qualifying kind rail', async () => {
    h.people = [person({ user_id: 'pro0', display_name: 'Pat One' }), ...['G1', 'G2', 'G3'].map((n) => person({ user_id: n, display_name: n }))];
    wrap(<WhoToFollowRail slot={1} />);
    await screen.findByText('G1');
    await waitFor(() => expect(kindCalls().length).toBe(2));
    await waitFor(() => expect(screen.queryByText('Pat One')).toBeNull());
  });
  it('keeps them when the kind rail has under 3 cards', async () => {
    h.kind.pro = pros.slice(0, 2);
    h.people = [person({ user_id: 'pro0', display_name: 'Pat One' }), ...['G1', 'G2', 'G3'].map((n) => person({ user_id: n, display_name: n }))];
    wrap(<WhoToFollowRail slot={1} />);
    await waitFor(() => expect(kindCalls().length).toBe(2));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText('Pat One')).toBeTruthy();
  });
});

describe('kind card actions', () => {
  it('dismiss writes suggestion_dismissals with actor_type personal', async () => {
    wrap(<KindRail kind="pro" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Hide Pat One' }));
    await waitFor(() => expect(h.from).toHaveBeenCalledWith('suggestion_dismissals'));
    expect(h.insert).toHaveBeenCalledWith({ actor_type: 'personal', actor_id: 'pro0' });
  });
  it('follow goes through useToggleFollow', async () => {
    wrap(<KindRail kind="creator" />);
    await screen.findByText('Cara One');
    const card = screen.getByText('Cara One').closest('[role="button"]') as HTMLElement;
    fireEvent.click(card.querySelector('button:last-of-type') as HTMLElement);
    await waitFor(() => expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({ targetActorType: 'personal', targetActorId: 'cr0', isFollowing: false })));
  });
});

describe('See all', () => {
  it('opens /find-people?kind=pro and ?kind=creator', async () => {
    const { unmount } = wrap(<KindRail kind="pro" />);
    fireEvent.click(await screen.findByRole('button', { name: 'See all, Pros to follow' }));
    expect(screen.getByTestId('probe').textContent).toBe('/find-people?kind=pro');
    unmount();
    wrap(<KindRail kind="creator" />);
    fireEvent.click(await screen.findByRole('button', { name: 'See all, Creators to follow' }));
    expect(screen.getByTestId('probe').textContent).toBe('/find-people?kind=creator');
  });
  it('FindPeoplePage with kind lists the RPC rows under the kind title', async () => {
    wrap(<FindPeoplePage />, '/find-people?kind=creator');
    const list = await screen.findByTestId('find-people-kind-list');
    await waitFor(() => expect(list.textContent).toContain('Cara Three'));
    expect(kindCalls()[0][1]).toEqual({ p_kind: 'creator', p_limit: 50 });
    expect(screen.getAllByText('Creators to follow').length).toBeGreaterThan(0);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});

describe('guests', () => {
  it('the hook is disabled and no kind rail renders', async () => {
    h.user = { id: 'guest', is_anonymous: true };
    wrap(<KindRail kind="pro" />);
    await new Promise((r) => setTimeout(r, 20));
    expect(kindCalls()).toHaveLength(0);
    expect(screen.queryByTestId('pros-to-follow-rail')).toBeNull();
  });
});
