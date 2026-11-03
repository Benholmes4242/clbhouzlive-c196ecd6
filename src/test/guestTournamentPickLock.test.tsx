import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
const f = vi.hoisted(() => ({ user: null as { id: string; is_anonymous: boolean } | null, time: '2026-11-05T03:19:00Z' as string | null, locked: false, rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user }) }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => null }));
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => () => true }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map() }) }));
import { PickMemberBands } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands';
const i18n = createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', initAsync: false, resources: { en: { tourhub: en } } });
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  f.user = null; f.time = '2026-11-05T03:19:00Z'; f.locked = false;
  f.rpc.mockReset().mockImplementation(async (name: string) => ({ data: name === 'tournament_pick_locks_at' ? f.time : name === 'tournament_pick_is_locked' ? f.locked : name === 'get_tournament_pick_state' ? [{ my_player_id: null, locks_at: f.time, locked: false, followed_pickers: 0, followed_top: [] }] : null, error: null }));
});
afterEach(() => { cleanup(); client.clear(); });
function mount() { render(<MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}><PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={[]} startedPlayers={new Set()} onPick={() => {}} onRecord={() => {}} /></I18nextProvider></QueryClientProvider></MemoryRouter>); }
describe('guest tournament lock authority', () => {
  it('signed-out viewers read both public scalar functions and never member state', async () => {
    mount(); await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('tournament_pick_is_locked', { p_tournament_id: 'event' }));
    expect(f.rpc).toHaveBeenCalledWith('tournament_pick_locks_at', { p_tournament_id: 'event' });
    expect(f.rpc).not.toHaveBeenCalledWith('get_tournament_pick_state', expect.anything());
  });
  it('anonymous viewers also use public lock reads', async () => {
    f.user = { id: 'guest', is_anonymous: true }; mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('tournament_pick_locks_at', { p_tournament_id: 'event' }));
    expect(f.rpc).not.toHaveBeenCalledWith('get_tournament_pick_state', expect.anything());
  });
  it('the server locked flag removes the guest card', async () => {
    f.locked = true; mount();
    await waitFor(() => expect(client.getQueryData(['tourhub', 'guest-pick-lock', 'event', undefined])).toEqual({ locks_at: f.time, locked: true }));
    expect(screen.queryByRole('button', { name: 'Pick' })).toBeNull();
  });
  it('null lock time stays null and unlocked rather than inventing a timestamp', async () => {
    f.time = null; mount();
    await waitFor(() => expect(client.getQueryData(['tourhub', 'guest-pick-lock', 'event', undefined])).toEqual({ locks_at: null, locked: false }));
    expect(screen.getByRole('button', { name: 'Pick' })).toBeTruthy();
  });
  it('members retain the member-state function and issue no public lock reads', async () => {
    f.user = { id: 'member', is_anonymous: false }; mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_tournament_pick_state', { p_tournament_id: 'event' }));
    expect(f.rpc).not.toHaveBeenCalledWith('tournament_pick_locks_at', expect.anything());
    expect(f.rpc).not.toHaveBeenCalledWith('tournament_pick_is_locked', expect.anything());
  });
});