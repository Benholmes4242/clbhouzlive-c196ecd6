import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, renderHook, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { WhsConnection } from '@/lib/whs/types';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  connection: null as WhsConnection | null, fetched: true, connectionError: false,
  total: 252 as number | null, totalState: 'ok' as 'ok' | 'loading' | 'error',
  eg: 1.5 as number | null, manual: 12, profileError: false, hidden: false,
  data: [{ play_date: '2019-03-15' }] as { play_date: string }[], readError: null as Error | null,
  update: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), from: vi.fn(),
  hold: false, release: null as ((value: { error: null }) => void) | null,
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me', is_public: true, eg_handicap_index: h.eg, manual_handicap_index: h.manual, hide_handicap_chip: h.hidden }, loading: false, error: h.profileError ? new Error('profile failed') : null }) }));
vi.mock('@/lib/whs/hooks', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/hooks')>(), useWhsConnection: () => ({ data: h.connection, isFetched: h.fetched, isError: h.connectionError }) }));
vi.mock('@/hooks/profile/useMemberRoundTotal', () => ({ useMemberRoundTotal: () => ({ total: h.total, state: h.totalState }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useHasBusinesses: () => ({ count: 0 }) }));
vi.mock('@/hooks/useMyRequests', () => ({ useMyRequestsList: () => ({ data: [], isLoading: false, isError: false, error: null }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: vi.fn() }) }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }));
vi.mock('@/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({ showDeleteConfirm: false, setShowDeleteConfirm: vi.fn(), showBusinessWarning: false, setShowBusinessWarning: vi.fn(), ownedBusinessNames: [], deleteConfirmText: '', setDeleteConfirmText: vi.fn(), isDeleting: false, initiateDelete: vi.fn(), confirmDelete: vi.fn() }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => Promise.resolve({ error: null }), from: (table: string) => {
  h.from(table);
  const chain = { select: (...args: unknown[]) => { h.select(...args); return chain; }, eq: (...args: unknown[]) => { h.eq(...args); return chain; }, order: (...args: unknown[]) => { h.order(...args); return chain; }, limit: (...args: unknown[]) => { h.limit(...args); return chain; }, update: (payload: unknown) => { h.update(payload); return chain; }, then: (resolve: (value: unknown) => unknown) => h.hold && table === 'user_profiles' ? new Promise<{ error: null }>(r => { h.release = r; }).then(resolve) : Promise.resolve({ data: h.data, error: table === 'whs_scores' ? h.readError : null }).then(resolve) };
  return chain;
} } }));

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import { useMemberFirstRoundYear } from '@/hooks/profile/useMemberFirstRoundYear';
const CONNECTION: WhsConnection = { id: 'connection-me', provider: 'england_golf', passport_id: 1, membership_number: '123', last_synced_at: '2026-10-29T08:00:00Z', last_sync_status: 'ok', last_sync_error: null, consecutive_failures: 0, initial_sync_complete: true, created_at: '2019-03-15' };
let qc: QueryClient;
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function mount() { return render(<Wrapper><div className="ep-shell"><SettingsTabContent /></div><Location /></Wrapper>); }
const figure = (label: string) => screen.getByTestId('st2-handicap-card').querySelector(`[data-figure="${label}"] b`);
beforeEach(() => { vi.clearAllMocks(); qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); h.connection = { ...CONNECTION }; h.fetched = true; h.connectionError = false; h.total = 252; h.totalState = 'ok'; h.eg = 1.5; h.manual = 12; h.profileError = false; h.hidden = false; h.data = [{ play_date: '2019-03-15' }]; h.readError = null; h.hold = false; h.release = null; });
afterEach(() => { cleanup(); qc.clear(); });

describe('ST2 Settings handicap card', () => {
  it('connected provider header navigates to the canonical manage flow and shows synced status', () => {
    mount(); const top = screen.getByRole('button', { name: /England Golf.*Connected · synced.*Manage/ });
    fireEvent.click(top); expect(screen.getByTestId('location').textContent).toBe('/manage/handicap');
  });
  it('without a sync timestamp shows Connected only', () => { h.connection = { ...CONNECTION, last_synced_at: null }; mount(); expect(screen.getByRole('button', { name: /England Golf.*Connected.*Manage/ }).querySelector('.st2-status')?.textContent).toBe('Connected'); });
  it('prints the resolved federation index, plain round total and read first year', async () => { mount(); expect(figure('Index')?.textContent).toBe('1.5'); expect(figure('Rounds')?.textContent).toBe('252'); await waitFor(() => expect(figure('First round')?.textContent).toBe('2019')); });
  it('a connected unknown index never falls back to manual handicap', () => { h.eg = null; mount(); expect(figure('Index')?.textContent).toBe('–'); expect(figure('Index')).toHaveAttribute('data-unknown', 'true'); });
  it('failed profile read suppresses a stale index', () => { h.profileError = true; mount(); expect(figure('Index')?.textContent).toBe('–'); });
  it.each(['loading', 'error'] as const)('%s round total discards stale figures', state => { h.totalState = state; mount(); expect(figure('Rounds')?.textContent).toBe('–'); });
  it('first-round read is a dash while fetching', () => { mount(); expect(figure('First round')?.textContent).toBe('–'); });
  it('a failed first-round read shows a dash', async () => { h.readError = new Error('refused'); mount(); await waitFor(() => expect(qc.getQueryState(['profile', 'first-round-year', CONNECTION.id])?.status).toBe('error')); expect(figure('First round')?.textContent).toBe('–'); });
  it('a successful zero total is 0 but first round remains unknown even with a cached year', async () => { h.total = 0; mount(); await waitFor(() => expect(qc.getQueryState(['profile', 'first-round-year', CONNECTION.id])?.status).toBe('success')); expect(figure('Rounds')?.textContent).toBe('0'); expect(figure('First round')?.textContent).toBe('–'); });
  it('unfetched connection discards all stale figures', () => { h.fetched = false; mount(); for (const label of ['Index', 'Rounds', 'First round']) expect(figure(label)?.textContent).toBe('–'); });
  it('disconnected card has no figure strip and connects through the existing destination', () => { h.connection = null; mount(); expect(screen.getByTestId('st2-handicap-card').querySelector('h3')?.textContent).toBe('Official handicap'); expect(figure('Index')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' })); expect(screen.getByTestId('location').textContent).toBe('/manage/handicap'); expect(screen.getByRole('switch', { name: 'Connect prompts' })).toHaveAttribute('aria-checked', 'true'); });
  it.each([true, false])('switch uses the existing inverse hidden flag and update handler, connected=%s', async connected => { if (!connected) h.connection = null; mount(); const toggle = screen.getByRole('switch', { name: connected ? 'Index in the top bar' : 'Connect prompts' }); fireEvent.click(toggle); await waitFor(() => expect(h.update).toHaveBeenCalledWith({ hide_handicap_chip: true })); expect(h.eq).toHaveBeenCalledWith('id', 'me'); });
  it('hidden chip switches on by writing false, disabled until the save settles', async () => { h.hidden = true; h.hold = true; mount(); const toggle = screen.getByRole('switch', { name: 'Index in the top bar' }); expect(toggle).toHaveAttribute('aria-checked', 'false'); fireEvent.click(toggle); await waitFor(() => expect(toggle).toBeDisabled()); expect(h.update).toHaveBeenCalledWith({ hide_handicap_chip: false }); h.release?.({ error: null }); await waitFor(() => expect(toggle).not.toBeDisabled()); });
  it('Privacy no longer contains the old chip switch', () => { const { container } = mount(); const group = [...container.querySelectorAll('.ep-group')].find(g => g.textContent === 'Privacy'); expect(group?.nextElementSibling?.textContent).not.toContain('Handicap button'); expect(group?.nextElementSibling?.querySelector('[aria-label="Index in the top bar"]')).toBeNull(); });
});
describe('useMemberFirstRoundYear', () => {
  it('reads only earliest play_date for the connection in ascending order with limit one', async () => { const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); await waitFor(() => expect(result.current).toEqual({ year: 2019, state: 'ok' })); expect(h.from).toHaveBeenCalledWith('whs_scores'); expect(h.select).toHaveBeenCalledWith('play_date'); expect(h.eq).toHaveBeenCalledWith('connection_id', CONNECTION.id); expect(h.order).toHaveBeenCalledWith('play_date', { ascending: true }); expect(h.limit).toHaveBeenCalledWith(1); });
  it('unrun query is loading, never a year', () => { h.connection = null; h.fetched = false; const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); expect(result.current).toEqual({ year: null, state: 'loading' }); expect(h.from).not.toHaveBeenCalled(); });
  it('read failure returns error and no year', async () => { h.readError = new Error('refused'); const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); await waitFor(() => expect(result.current).toEqual({ year: null, state: 'error' })); });
  it('a successful empty read returns known absence', async () => { h.data = []; const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); await waitFor(() => expect(result.current).toEqual({ year: null, state: 'ok' })); });
  it('fetched no connection performs no read and returns known absence', () => { h.connection = null; const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); expect(result.current).toEqual({ year: null, state: 'ok' }); expect(h.from).not.toHaveBeenCalled(); });
  it('connection errors discard a cached year', () => { h.connectionError = true; qc.setQueryData(['profile', 'first-round-year', CONNECTION.id], 2019); const { result } = renderHook(() => useMemberFirstRoundYear('me'), { wrapper: Wrapper }); expect(result.current).toEqual({ year: null, state: 'error' }); });
});