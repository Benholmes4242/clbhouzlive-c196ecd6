// BRIEF_PRO_RESULTS_SWITCH_UI — a tour pro with "Show my tour results" off
// renders like a pro with no results yet to everyone but himself. The client
// gate is useProResultsVisible (rpc pro_results_visible, fail closed); the
// tour-feed hooks must receive '' so no per-member-ungated read is made.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProProfileBuildOne, type ProProfileProps } from '@/features/pro-profile/ProProfileBuildOne';
import type { ProEvent } from '@/features/pro-profile/proProfileRules';

const h = vi.hoisted(() => ({
  visible: true as boolean | 'pending' | 'error',
  rpc: vi.fn(),
  seasonPlayer: [] as string[],
  livePlayer: [] as string[],
  statsPlayer: [] as string[],
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const winEvent: ProEvent = { id: 'e1', user_id: 'pro', source: 'owgr', event_name: 'Hulencourt', tour_name: 'Alps Tour', start_date: '2026-10-15', end_date: '2026-10-17', country: 'Belgium', venue: null, finish: '1', tee_time: null, tee_hole: null, to_par: null, total_strokes: 200, scheduled_rounds: 3, owgr_event_id: '11624', owgr_points: 1, owgr_rank_before: 1440, owgr_rank_after: 1400, owgr_year: 2026, owgr_week: 42, created_at: '', updated_at: '', rounds: [] };

vi.mock('@/features/pro-profile/useProProfile', () => ({
  useProEvents: () => ({ data: [winEvent], isSuccess: true, isError: false }),
  useProWorldRank: () => ({ data: { rank: 1400, season_start_rank: 1440, prior_rank: 1410 }, isSuccess: true, isError: false }),
}));
const seasonRow = { tournament_id: 't1', name: 'Hulencourt', tour: 'Alps Tour', start_date: '2026-10-15', end_date: '2026-10-17', status: '', display_position: '1', finish_position: 1, score: null, round_1: 70, round_2: 65, round_3: 65, round_4: null };
vi.mock('@/features/tourhub/player-v2/data/usePlayerData', () => ({
  usePlayerSeasonResults: (playerId: string) => { h.seasonPlayer.push(playerId); return { data: [seasonRow], isSuccess: true, isError: false }; },
}));
vi.mock('@/features/pro-profile/LinkedProSections', () => ({
  useLinkedProLive: (playerId: string) => { h.livePlayer.push(playerId); return { data: { tournamentId: 'live' }, isSuccess: true, isError: false }; },
  useLinkedProStats: (playerId: string) => { h.statsPlayer.push(playerId); return { data: { player: { scoring_average: 70 }, rows: [] }, isSuccess: true, isError: false }; },
  LinkedLiveCard: () => <div data-testid="linked-live" />,
  HowProPlays: () => <div data-testid="linked-stats" />,
}));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [] }) }));
vi.mock('@/features/pro-profile/useProCollections', () => ({
  useProBag: () => ({ data: [{ id: 'b1', user_id: 'pro', slot: 'driver', brand: 'Ping', model: 'G440', detail: null, business_id: null, created_at: '' }], isSuccess: true, isError: false }),
  useProPartners: () => ({ data: [{ id: 'p1', user_id: 'pro', name: 'Acme', business_id: null, website: null, created_at: '' }], isSuccess: true, isError: false }),
  useProCareer: () => ({ data: [], isSuccess: true, isError: false }),
  useProBusinesses: () => ({ data: [], isSuccess: true, isError: false }),
}));

const props: ProProfileProps = {
  pro: { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: 'alps', pro_club: null, pro_player_id: 'player' },
  name: 'Mason Essam', owner: false, viewerId: 'viewer', followers: 3, friends: 14, followersReady: true,
  onFollowers: vi.fn(), onFriends: vi.fn(), onAvatar: vi.fn(), onEdit: vi.fn(), onShare: vi.fn(),
  onFollow: vi.fn(), following: false, followBusy: false, onFriend: vi.fn(), onMessage: vi.fn(), messageBusy: false,
  onSeeAllResults: vi.fn(), menu: <span>Menu</span>,
};

function mountProfile(over: Partial<ProProfileProps> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><ProProfileBuildOne {...props} {...over} /></QueryClientProvider></MemoryRouter>);
}

beforeEach(() => {
  h.visible = true; h.seasonPlayer = []; h.livePlayer = []; h.statsPlayer = [];
  h.rpc.mockClear();
  h.rpc.mockImplementation((name: string) => {
    if (name !== 'pro_results_visible') return Promise.resolve({ data: null, error: null });
    if (h.visible === 'pending') return new Promise(() => {});
    if (h.visible === 'error') return Promise.resolve({ data: null, error: { message: 'denied' } });
    return Promise.resolve({ data: h.visible, error: null });
  });
});
afterEach(cleanup);

describe('Pro results switch — profile hero and sections', () => {
  it('visitor with the switch off sees no results sections and the feed hooks get an empty player id', async () => {
    h.visible = false;
    mountProfile();
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('pro_results_visible', { p_user: 'pro' }));
    expect(h.seasonPlayer).toEqual(['']);
    expect(h.livePlayer).toEqual(['']);
    expect(h.statsPlayer).toEqual(['']);
    expect(screen.queryByText('WORLD RANKING')).toBeNull();
    expect(screen.queryByText(/BEST FINISH/)).toBeNull();
    expect(screen.queryByText('EVENTS')).toBeNull();
    expect(screen.queryByText('TOP 10S')).toBeNull();
    expect(screen.queryByText('BEST')).toBeNull();
    expect(screen.getByText('FOLLOWERS')).toBeInTheDocument();
    expect(screen.getByText('FRIENDS')).toBeInTheDocument();
    expect(screen.queryByTestId('linked-live')).toBeNull();
    expect(screen.queryByTestId('linked-stats')).toBeNull();
    expect(screen.queryByText('2026 SEASON')).toBeNull();
    expect(document.querySelector('[data-pro-career]')).toBeNull();
    expect(document.querySelector('[data-pro-bag]')).not.toBeNull();
    expect(document.querySelector('[data-pro-partners]')).not.toBeNull();
  });

  it('visitor with the switch on sees everything as today', async () => {
    mountProfile();
    await waitFor(() => expect(screen.getByText('WORLD RANKING')).toBeInTheDocument());
    // The first render is still settling ('' player id); the settled read
    // swaps in the real id and never flashes results beforehand.
    expect(h.seasonPlayer[h.seasonPlayer.length - 1]).toBe('player');
    expect(screen.getAllByText('EVENTS').length).toBeGreaterThan(0);
    expect(screen.getByTestId('linked-live')).toBeInTheDocument();
    expect(screen.getByTestId('linked-stats')).toBeInTheDocument();
    expect(screen.getByText('2026 SEASON')).toBeInTheDocument();
    expect(document.querySelector('[data-pro-career]')).not.toBeNull();
  });

  it('owner with the switch off still sees everything and the rpc is never called', async () => {
    h.visible = false;
    mountProfile({ owner: true });
    await waitFor(() => expect(screen.getByText('WORLD RANKING')).toBeInTheDocument());
    expect(h.rpc.mock.calls.filter(c => c[0] === 'pro_results_visible')).toHaveLength(0);
    expect(screen.getAllByText('EVENTS').length).toBeGreaterThan(0);
    expect(screen.getByText('2026 SEASON')).toBeInTheDocument();
    expect(document.querySelector('[data-pro-career]')).not.toBeNull();
  });

  it('while visibility is loading no results section renders', async () => {
    h.visible = 'pending';
    mountProfile();
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('pro_results_visible', { p_user: 'pro' }));
    expect(screen.queryByText('WORLD RANKING')).toBeNull();
    expect(screen.queryByText('2026 SEASON')).toBeNull();
    expect(screen.queryByTestId('linked-live')).toBeNull();
    expect(document.querySelector('[data-pro-career]')).toBeNull();
    expect(screen.getByText('FOLLOWERS')).toBeInTheDocument();
  });

  it('an rpc error fails closed', async () => {
    h.visible = 'error';
    mountProfile();
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('pro_results_visible', { p_user: 'pro' }));
    await waitFor(() => expect(screen.getByText('FOLLOWERS')).toBeInTheDocument());
    expect(screen.queryByText('WORLD RANKING')).toBeNull();
    expect(screen.queryByText('2026 SEASON')).toBeNull();
    expect(document.querySelector('[data-pro-career]')).toBeNull();
  });
});


