import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { readProMembers, invalidateProMembers, PRO_MEMBERS_STALE_MS, type ProMember } from '@/features/pro-verification/proMembersCache';
import { ProMemberName } from '@/features/pro-verification/ProLabel';
import { profileProTabs, showPendingProNote } from '@/features/pro-verification/profileProRules';
import { ProfileTourTab } from '@/features/pro-verification/ProfileTourTab';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import type { PlayerResult } from '@/features/tourhub/player-v2/data/usePlayerData';

const pro: ProMember = { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'DP World Tour', pro_tour_code: 'euro', pro_club: null, pro_player_id: 'player' };
const result = (n: number): PlayerResult => ({ tournament_id: `event-${n}`, name: `Event ${n}`, end_date: `2026-10-${String(n + 1).padStart(2, '0')}`, start_date: '2026-10-01', display_position: 'T11', score: -9, round_1: 1, round_2: -3, round_3: -2, round_4: -5, is_winner: false, tied: true, finish_position: 11, tour: 'euro', field_size: 100, beat_percent: 90, event_status: 'closed', status: 'closed' });
function mount(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { invalidateProMembers(); f.rpc.mockReset().mockResolvedValue({ data: [pro], error: null }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Brief 2 public pro identity', () => {
  it('batches and deduplicates all visible screen ids into one RPC', async () => {
    await Promise.all([readProMembers(['pro', 'member']), readProMembers(['pro', 'other'])]);
    expect(f.rpc).toHaveBeenCalledTimes(1);
    expect(f.rpc).toHaveBeenCalledWith('get_pro_members', { p_user_ids: ['pro', 'member', 'other'] });
  });
  it('caches returned and absent identities per id for five minutes', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    await readProMembers(['pro', 'member']);
    now.mockReturnValue(1000 + PRO_MEMBERS_STALE_MS - 1);
    await readProMembers(['member', 'pro']);
    expect(f.rpc).toHaveBeenCalledTimes(1);
    now.mockReturnValue(301000);
    await readProMembers(['pro', 'member']);
    expect(f.rpc).toHaveBeenCalledTimes(2);
  });
  it('invalidating own status refetches visible identities', async () => {
    mount(<ProMemberName userId="pro">Name</ProMemberName>);
    await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));
    invalidateProMembers();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(2));
  });
  it('pending and unverified ids have no pro identity', async () => {
    const members = await readProMembers(['pro', 'pending', 'unverified']);
    expect(members.get('pro')?.pro_kind).toBe('tour_pro');
    expect(members.get('pending')).toBeNull();
    expect(members.get('unverified')).toBeNull();
  });
  it('failed public reads never grant a label', async () => {
    f.rpc.mockResolvedValue({ data: [pro], error: new Error('denied') });
    await expect(readProMembers(['pro'])).rejects.toThrow('denied');
  });
  it('pro identity precedes Creator in the cover identity row', () => {
    const { container } = mount(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Long Name" subline={null} isPro isCreator />);
    const row = container.querySelector('.pro-identity-row');
    expect(row?.children[0].tagName).toBe('H1');
    expect(row?.children[1].getAttribute('data-size')).toBe('large');
    expect(row?.children[2].className).toBe('profile-creator-label');
  });
});

describe('Brief 2 profile visibility rules', () => {
  it('linked tour pro gets a public Tour tab', () => { expect(profileProTabs(pro, false, false).tour).toBe(true); });
  it('uncovered owner gets Tour instead of unconnected Handicap', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, true, false)).toEqual({ tour: true, handicap: false }); });
  it('uncovered visitor gets neither Tour nor Handicap', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, false, false)).toEqual({ tour: false, handicap: false }); });
  it('connected owner keeps both Tour and Handicap', () => { expect(profileProTabs(pro, true, true)).toEqual({ tour: true, handicap: true }); });
  it('teaching pro gets no Tour tab', () => { expect(profileProTabs({ ...pro, pro_kind: 'teaching_pro' }, true, false)).toEqual({ tour: false, handicap: true }); });
  it('ordinary owner retains Handicap', () => { expect(profileProTabs(null, true, false)).toEqual({ tour: false, handicap: true }); });
  it('pending note is private to the owner', () => { expect(showPendingProNote(true, true, null)).toBe(true); expect(showPendingProNote(false, true, null)).toBe(false); });
  it('verified profile suppresses pending note', () => { expect(showPendingProNote(true, true, pro)).toBe(false); });
});

describe('Brief 2 Tour results', () => {
  it('reads current season and shows eight starts with both player links', async () => {
    f.rpc.mockResolvedValue({ data: Array.from({ length: 10 }, (_, i) => result(i)), error: null });
    const { container } = mount(<ProfileTourTab pro={pro} displayName="Member" isOwner={false} />);
    await waitFor(() => expect(container.querySelectorAll('[data-player-result]')).toHaveLength(8));
    expect(f.rpc).toHaveBeenCalledWith('get_player_season_results', { p_player_id: 'player', p_year: new Date().getUTCFullYear() });
    const links = [...container.querySelectorAll('a')].filter(a => a.getAttribute('href') === '/tourhub/player/player');
    expect(links).toHaveLength(2);
    expect(container.querySelectorAll('[data-player-result]')[0].getAttribute('data-player-result')).toBe('event-9');
  });
  it('falls back exactly one season only when current results are empty', async () => {
    const year = new Date().getUTCFullYear();
    f.rpc.mockImplementation(async (_name, args) => ({ data: args.p_year === year ? [] : [result(0)], error: null }));
    const { container } = mount(<ProfileTourTab pro={pro} displayName="Member" isOwner={false} />);
    await waitFor(() => expect(container.querySelectorAll('[data-player-result]')).toHaveLength(1));
    expect(f.rpc).toHaveBeenCalledTimes(2);
    expect(f.rpc).toHaveBeenLastCalledWith('get_player_season_results', { p_player_id: 'player', p_year: year - 1 });
  });
  it('does not borrow previous season after a current-season error', async () => {
    f.rpc.mockResolvedValue({ data: null, error: new Error('failed') });
    const { container } = mount(<ProfileTourTab pro={pro} displayName="Member" isOwner={false} />);
    await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector('[role="status"]')).toBeNull());
    expect(f.rpc).toHaveBeenCalledTimes(1);
  });
  it('uncovered owner note makes no player read', () => {
    const { container } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null, pro_tour: 'Alps Tour' }} displayName="Member" isOwner />);
    expect(container.querySelector('.pro-profile-note')).not.toBeNull();
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it('uncovered visitor renders nothing and makes no player read', () => {
    const { container } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null }} displayName="Member" isOwner={false} />);
    expect(container.childElementCount).toBe(0);
    expect(f.rpc).not.toHaveBeenCalled();
  });
});