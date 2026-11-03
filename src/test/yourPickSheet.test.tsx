import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: 'member', is_anonymous: false } as { id: string; is_anonymous: boolean } | null, guest: false, errorToast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: mocks.user }) }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => mocks.guest ? { id: 'guest' } : null }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.errorToast } }));

import { YourPickSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet';
import { searchPickField, localPickLock, pickCountry } from '@/features/tourhub/components/overview-v3/HybridHeroBands/yourPickRules';
import { useTournamentPickState, tournamentPickStateKey, type PickFieldPlayer } from '@/features/tourhub/hooks/useTournamentPick';

const i18n = createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });
const names = ['Wyndham Clark', 'Tom Kim', 'Doug Ghim', 'Steven Fisk', 'Tony Finau', 'Patrick Fishburn', 'Alejandro Fierro', 'Mauricio Figueroa', 'A.J. Ewart', 'Rasmus Neergaard-Petersen'];
const field: PickFieldPlayer[] = names.map((name, i) => ({ player_id: `p${i}`, full_name: name, country: i === 6 ? null : 'UNITED STATES', world_rank: i >= 6 ? null : i + 5, photo_url: null, headshot_override: null }));
const ourPicks = [{ playerId: 'p0', playerName: names[0] }, { playerId: 'p2', playerName: names[2] }, { playerId: 'p1', playerName: names[1] }];
let state: { my_player_id: string | null; locks_at: string | null; locked: boolean; followed_pickers: number; followed_top: { player_id: string; player_name: string; picks: number }[] };
let writeError: string | null;
let client: QueryClient;
let close: ReturnType<typeof vi.fn>;
const props = () => ({ open: true, onClose: close, tournamentId: 'event', eventName: 'Mexico Open', ourPicks, tourCode: 'pga' });
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={i18n}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;
function mount() { return render(<YourPickSheet {...props()} />, { wrapper }); }
async function ready() { await screen.findByRole('radio', { name: 'Wyndham Clark' }); }
function submit() { return document.querySelector<HTMLButtonElement>('[data-pick-submit]') as HTMLButtonElement; }

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false }, mutations: { retry: false } } });
  close = vi.fn(); writeError = null;
  mocks.user = { id: 'member', is_anonymous: false }; mocks.guest = false; mocks.errorToast.mockReset();
  state = { my_player_id: null, locks_at: '2026-11-05T07:40:00Z', locked: false, followed_pickers: 12, followed_top: [{ player_id: 'p0', player_name: names[0], picks: 5 }, { player_id: 'p3', player_name: names[3], picks: 1 }] };
  mocks.rpc.mockReset().mockImplementation(async (name: string, args: { p_player_id?: string }) => {
    if (name === 'get_pick_field') return { data: field, error: null };
    if (name === 'get_tournament_pick_state') return { data: [state], error: null };
    if (name === 'set_tournament_pick') {
      if (writeError) return { data: null, error: { message: writeError } };
      state = { ...state, my_player_id: args.p_player_id ?? null };
      return { data: 'ok', error: null };
    }
    throw new Error(`Unexpected RPC ${name}`);
  });
});
afterEach(() => { cleanup(); client.clear(); });

describe('Your pick sheet build 1', () => {
  it('renders our three in prop rank order with numbered tags and no field duplicates', async () => {
    mount(); await ready();
    const ours = document.querySelector('[data-pick-ours]');
    expect(Array.from(ours?.querySelectorAll('[data-pick-player]') ?? []).map(row => row.getAttribute('data-pick-player'))).toEqual(['p0', 'p2', 'p1']);
    expect(Array.from(ours?.querySelectorAll('[data-our-pick]') ?? []).map(tag => tag.textContent)).toEqual(['Our pick 1', 'Our pick 2', 'Our pick 3']);
    const rest = document.querySelector('[data-pick-field]');
    expect(Array.from(rest?.querySelectorAll('[data-pick-player]') ?? []).map(row => row.getAttribute('data-pick-player'))).toEqual(['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);
  });
  it('reads only the field and state RPCs with tournament identity', async () => {
    mount(); await ready();
    expect(mocks.rpc).toHaveBeenCalledWith('get_pick_field', { p_tournament_id: 'event' });
    expect(mocks.rpc).toHaveBeenCalledWith('get_tournament_pick_state', { p_tournament_id: 'event' });
    expect(new Set(mocks.rpc.mock.calls.map(call => call[0]))).toEqual(new Set(['get_pick_field', 'get_tournament_pick_state']));
  });
  it('shows followed tiles and singular/plural counts when at least one followed member picked', async () => {
    mount(); await ready();
    const tiles = document.querySelector('[data-pick-followed]') as HTMLElement;
    expect(within(tiles).getAllByRole('button')).toHaveLength(2);
    expect(tiles.textContent).toContain('5 picks'); expect(tiles.textContent).toContain('1 pick');
  });
  it('hides followed tiles when no followed member picked', async () => {
    state.followed_pickers = 0; mount(); await ready();
    expect(document.querySelector('[data-pick-followed]')).toBeNull();
  });
  it('tapping a followed tile chooses its field player', async () => {
    mount(); await ready();
    fireEvent.click(within(document.querySelector('[data-pick-followed]') as HTMLElement).getByRole('button', { name: 'Steven Fisk' }));
    expect(screen.getByRole('radio', { name: 'Steven Fisk' })).toHaveAttribute('aria-checked', 'true');
  });
  it('unranked metadata omits a missing country and keeps RPC order', async () => {
    mount(); await ready();
    expect(screen.getByRole('radio', { name: 'Alejandro Fierro' }).textContent).toBe('Alejandro FierroNot ranked');
    expect(screen.getByRole('radio', { name: 'Mauricio Figueroa' }).textContent).toContain('Not ranked · United States');
  });
  it('fi search matches all five required surname prefixes in field order', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    expect(screen.getAllByRole('radio').map(row => row.getAttribute('aria-label'))).toEqual(['Steven Fisk', 'Tony Finau', 'Patrick Fishburn', 'Alejandro Fierro', 'Mauricio Figueroa']);
    expect(document.querySelector('[data-pick-followed]')).toBeNull();
  });
  it('search retains our pick rank tags', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'kim' } });
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio').querySelector('[data-our-pick]')).toHaveAttribute('data-our-pick', '3');
  });
  it('zzz search shows a no-match line with its query', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(document.querySelector('[data-pick-no-results]')?.textContent).toBe('No one in the field matches "zzz".');
  });
  it('clear search returns the full sectioned list', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('textbox')).toHaveValue(''); expect(screen.getAllByRole('radio')).toHaveLength(10);
  });
  it('requires one chosen row before enabling the named pick button', async () => {
    mount(); await ready(); expect(submit()).toBeDisabled(); expect(submit().textContent).toBe('Choose a player');
    fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' }));
    expect(submit()).toBeEnabled(); expect(submit().textContent).toBe('Pick Tom Kim');
    fireEvent.click(screen.getByRole('radio', { name: 'Doug Ghim' }));
    expect(screen.getAllByRole('radio').filter(row => row.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });
  it('submits tournament and player ids, actively refetches state and closes', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries'); mount(); await ready();
    fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(mocks.rpc).toHaveBeenCalledWith('set_tournament_pick', { p_tournament_id: 'event', p_player_id: 'p1' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: tournamentPickStateKey('event', 'member'), refetchType: 'active' });
    expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_tournament_pick_state')).toHaveLength(2);
    expect(client.getQueryData(tournamentPickStateKey('event', 'member'))).toMatchObject({ my_player_id: 'p1' });
  });
  it('opens with the current pick chosen and closes without rewriting that pick', async () => {
    state.my_player_id = 'p1'; mount(); await ready();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(submit()); expect(close).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
  });
  it('reopening clears search and resets to the current pick', async () => {
    const view = mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Tony Finau' }));
    view.rerender(<YourPickSheet {...props()} open={false} />); state.my_player_id = 'p1';
    view.rerender(<YourPickSheet {...props()} />); await ready();
    expect(screen.getByRole('textbox')).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
  });
  it('locked state renders header and refusal only, with no list or submit', async () => {
    state.locked = true; mount(); await waitFor(() => expect(document.querySelector('[data-picks-locked]')).not.toBeNull());
    expect(screen.getByRole('heading').textContent).toBe('Who wins the Mexico Open?');
    expect(screen.queryByRole('textbox')).toBeNull(); expect(screen.queryAllByRole('radio')).toHaveLength(0); expect(submit()).toBeNull();
  });
  it('server lock refusal toasts exact copy and closes', async () => {
    writeError = 'picks are locked'; mount(); await ready(); fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(mocks.errorToast).toHaveBeenCalledWith('Picks are locked. Play has started.');
  });
  it('removed field player refusal refetches field and leaves sheet open', async () => {
    writeError = 'that player is not in the field'; mount(); await ready(); fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await waitFor(() => expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_pick_field')).toHaveLength(2));
    expect(close).not.toHaveBeenCalled(); expect(mocks.errorToast).toHaveBeenCalledWith('That player is no longer in the field.'); expect(submit()).toBeDisabled();
  });
  it('uses real shared squircle avatars for every player', async () => {
    mount(); await ready();
    for (const row of screen.getAllByRole('radio')) {
      const face = row.querySelector('[style*="34%"]'); expect(face).not.toBeNull();
      expect(Array.from(row.querySelectorAll<HTMLElement>('.your-pick-avatar [style]')).some(element => element.style.borderRadius === '50%')).toBe(false);
    }
  });
  it('null lock time shows only the live field count', async () => {
    state.locks_at = null; mount(); await ready(); expect(document.querySelector('.your-pick-subline')?.textContent).toBe('10 players');
  });
  it.each(['signed out', 'anonymous', 'guest'])('pick state read is disabled for %s', async mode => {
    if (mode === 'signed out') mocks.user = null;
    if (mode === 'anonymous') mocks.user = { id: 'anon', is_anonymous: true };
    if (mode === 'guest') mocks.guest = true;
    const hook = renderHook(() => useTournamentPickState('event'), { wrapper });
    expect(hook.result.current.fetchStatus).toBe('idle'); expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe('pick pure rules', () => {
  it('matches case-insensitive starts across spaces dots and hyphens, not substrings', () => {
    expect(searchPickField(field, 'FI').map(player => player.player_id)).toEqual(['p3', 'p4', 'p5', 'p6', 'p7']);
    expect(searchPickField(field, 'j').map(player => player.player_id)).toEqual(['p8']);
    expect(searchPickField(field, 'peter').map(player => player.player_id)).toEqual(['p9']);
    expect(searchPickField(field, 'isk')).toEqual([]);
  });
  it('formats lock time in viewer-local 24 hour time and full weekday', () => {
    const value = '2026-11-05T07:40:00Z'; const date = new Date(value);
    expect(localPickLock(value)).toEqual({ time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`, day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()] });
    expect(localPickLock(null)).toBeNull(); expect(localPickLock('bad')).toBeNull();
  });
  it('country metadata is title case with null omitted', () => {
    expect(pickCountry('SOUTH KOREA')).toBe('South Korea'); expect(pickCountry(null)).toBe('');
  });
});