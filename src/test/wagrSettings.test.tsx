import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const h = vi.hoisted(() => ({ link: null as any, summary: { rank: 318, best_rank: 312, counting_events: 36 } as any, lookup: { name: 'Lewy Hayward', country: 'England', rank: 318, isPro: false, slug: 'lewy-hayward-41967', playerId: 41967 }, invoke: vi.fn(), deleted: vi.fn(), visibility: true as boolean | null, write: vi.fn(), toast: vi.fn(), rank: null as any }));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toast } }));
vi.mock('@/features/pro-profile/useProProfile', () => ({ useProWorldRank: () => ({ data: h.rank, isError: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: h.invoke }, from: (table: string) => {
  let payload: any; let deleting = false;
  const chain = {
    select: () => chain,
    update: (value: any) => { payload = value; return chain; },
    delete: () => { deleting = true; return chain; },
    eq: (key: string, value: string) => { if (deleting) h.deleted(table, key, value); return chain; },
    single: () => payload ? h.write(payload) : Promise.resolve({ data: { show_tour_results: h.visibility }, error: null }),
    maybeSingle: () => Promise.resolve({ data: table === 'amateur_rank_links' ? h.link : h.summary, error: null }),
    then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
  }; return chain;
} } }));
import { SettingsWagrCard } from '@/features/amateur-ranking/SettingsWagrCard';
import { WagrLinkSheet } from '@/features/amateur-ranking/WagrLinkSheet';
import { SettingsTourResultsCard } from '@/features/pro-verification/SettingsTourResultsCard';
import { useShowTourResults } from '@/features/pro-verification/useShowTourResults';
import { rankingUpdated, wagrOrdinal, wagrCardVisible, tourResultsVisible } from '@/features/amateur-ranking/wagrSettingsRules';
const clients: QueryClient[] = [];
function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
function mount(node: React.ReactNode) { const { client, wrapper } = provider(); return { ...render(node, { wrapper }), client }; }
beforeEach(() => { vi.clearAllMocks(); h.link = null; h.summary = { rank: 318, best_rank: 312, counting_events: 36 }; h.lookup = { name: 'Lewy Hayward', country: 'England', rank: 318, isPro: false, slug: 'lewy-hayward-41967', playerId: 41967 }; h.visibility = true; h.rank = null; h.invoke.mockImplementation(async () => ({ data: h.lookup, error: null })); h.write.mockImplementation(async (value: any) => ({ data: value, error: null })); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); vi.useRealTimers(); });
for (const [name, pro, wagr, tour] of [
  ['amateur', { unknown: false, verified: false, pending: false, kind: null }, true, false],
  ['pending pro', { unknown: false, verified: false, pending: true, kind: 'tour_pro' }, false, false],
  ['verified tour pro', { unknown: false, verified: true, pending: false, kind: 'tour_pro' }, false, true],
  ['verified teaching pro', { unknown: false, verified: true, pending: false, kind: 'teaching_pro' }, false, false],
  ['unresolved pro', { unknown: true, verified: false, pending: false, kind: null }, false, false],
] as const) it(`WAGR card visibility for ${name}`, () => { const status = pro; expect(wagrCardVisible(status)).toBe(wagr); expect(tourResultsVisible(status)).toBe(tour); });
for (const status of [null, 'rejected']) it(`WAGR ${status ?? 'absent'} link offers linking`, async () => {
  h.link = status ? { status } : null; mount(<SettingsWagrCard userId="member" />);
  expect(await screen.findByRole('button', { name: 'Link your WAGR profile' })).toBeEnabled(); expect(h.invoke).not.toHaveBeenCalled();
});
it('WAGR pending link shows fetched rank and cancel deletes only member row', async () => {
  h.link = { status: 'pending', wagr_name: 'Lewy Hayward', wagr_slug: 'lewy-hayward-41967' }; mount(<SettingsWagrCard userId="member" />);
  await screen.findByText('Lewy Hayward · 318th'); fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
  await waitFor(() => expect(h.deleted).toHaveBeenCalledWith('amateur_rank_links', 'user_id', 'member'));
});
it('WAGR pending failed lookup preserves name without a rank', async () => {
  h.link = { status: 'pending', wagr_name: 'Lewy Hayward', wagr_slug: 'lewy-hayward-41967' }; h.invoke.mockResolvedValue({ error: new Error('blocked') }); mount(<SettingsWagrCard userId="member" />);
  await waitFor(() => expect(h.invoke).toHaveBeenCalled()); expect(screen.getByText('Lewy Hayward')).toBeInTheDocument(); expect(screen.queryByText(/318th/)).toBeNull();
});
it('WAGR verified figures retain plain rank, ordinal best and events', async () => {
  h.link = { status: 'verified', last_synced_at: null }; const v = mount(<SettingsWagrCard userId="member" />);
  await screen.findByText('312th'); expect(v.container.querySelector('[data-figure="World rank"] b')?.textContent).toBe('318'); expect(v.container.querySelector('[data-figure="Events"] b')?.textContent).toBe('36');
  expect(screen.getByText('Linked · first update on its way')).toBeInTheDocument(); expect(v.container.querySelector('.pro-label')).toHaveAttribute('data-kind', 'am');
});
it('WAGR unknown figures display dashes rather than invented values', async () => {
  h.link = { status: 'verified' }; h.summary = { rank: null, best_rank: null, counting_events: null }; const v = mount(<SettingsWagrCard userId="member" />);
  await screen.findByRole('button', { name: 'Unlink WAGR' }); expect([...v.container.querySelectorAll('.st2-figure b')].map(e => e.textContent)).toEqual(['–', '–', '–']);
});
it('WAGR unlink requires confirmation and deletes only member row', async () => {
  h.link = { status: 'verified' }; mount(<SettingsWagrCard userId="member" />); fireEvent.click(await screen.findByRole('button', { name: 'Unlink WAGR' }));
  expect(h.deleted).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: /^Unlink$/ })); await waitFor(() => expect(h.deleted).toHaveBeenCalledExactlyOnceWith('amateur_rank_links', 'user_id', 'member'));
});
for (const [iso, expected] of [[null, 'first update on its way'], ['2026-11-14T12:00:00Z', 'updated today'], ['2026-11-09T12:00:00Z', 'updated Monday'], ['2026-11-01T12:00:00Z', 'updated 1 Nov']] as const) it(`WAGR updated branch ${expected}`, () => { expect(rankingUpdated(iso, new Date('2026-11-14T15:00:00Z'))).toBe(expected); });
it('WAGR Best ordinals handle 11th, 12th, 13th and 21st', () => { expect([11, 12, 13, 21, 22, 23].map(wagrOrdinal)).toEqual(['11th', '12th', '13th', '21st', '22nd', '23rd']); });
async function typeLookup(value = 'wagr.com/playerprofile/lewy-hayward-41967') {
  fireEvent.change(screen.getByRole('textbox', { name: 'Your WAGR profile' }), { target: { value } });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
}
it('WAGR sheet debounces 600ms and disables Send until current amateur lookup succeeds', async () => {
  vi.useFakeTimers(); mount(<WagrLinkSheet userId="member" open onClose={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Send for checking' })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'lewy-hayward-41967' } });
  await act(async () => { await vi.advanceTimersByTimeAsync(599); }); expect(h.invoke).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(h.invoke).toHaveBeenCalledExactlyOnceWith('wagr-link', { body: { action: 'lookup', input: 'lewy-hayward-41967' } });
  expect(screen.getByRole('button', { name: 'Send for checking' })).toBeEnabled();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'different-123' } }); expect(screen.getByRole('button', { name: 'Send for checking' })).toBeDisabled();
});
it('WAGR sheet successful request invalidates owner claim and closes', async () => {
  vi.useFakeTimers(); const close = vi.fn(); const v = mount(<WagrLinkSheet userId="member" open onClose={close} />); const invalidate = vi.spyOn(v.client, 'invalidateQueries');
  await typeLookup(); expect(screen.getByText('Lewy Hayward')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Send for checking' })); await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(h.invoke).toHaveBeenLastCalledWith('wagr-link', { body: { action: 'request', input: 'wagr.com/playerprofile/lewy-hayward-41967' } }); expect(invalidate).toHaveBeenCalledWith({ queryKey: ['wagr-link', 'member'] }); expect(close).toHaveBeenCalled();
});
for (const [code, message] of [
  ['not_a_wagr_link', "That doesn't look like a WAGR profile link."],
  ['wagr_profile_is_pro', 'That WAGR profile is marked as a professional.'],
  ['unknown', "We couldn't reach WAGR just now. Try again in a minute."],
] as const) it(`WAGR sheet lookup error ${code}`, async () => {
  vi.useFakeTimers(); h.invoke.mockResolvedValue({ data: { code }, error: new Error('lookup failed') }); mount(<WagrLinkSheet userId="member" open onClose={vi.fn()} />); await typeLookup(); expect(screen.getByRole('alert')).toHaveTextContent(message); expect(screen.getByRole('button', { name: 'Send for checking' })).toBeDisabled();
});
it('WAGR sheet professional lookup refuses Send', async () => {
  vi.useFakeTimers(); h.lookup.isPro = true; mount(<WagrLinkSheet userId="member" open onClose={vi.fn()} />); await typeLookup(); expect(screen.getByRole('alert')).toHaveTextContent('That WAGR profile is marked as a professional.'); expect(screen.getByRole('button', { name: 'Send for checking' })).toBeDisabled();
});
for (const [code, message] of [
  ['already_linked', "You've already linked a WAGR profile."],
  ['claimed_by_another', 'Another member has already linked that profile. If it\'s yours, contact us.'],
  ['caller_is_pro', "Pros can't link a WAGR profile."],
  ['wagr_profile_is_pro', 'That WAGR profile is marked as a professional.'],
] as const) it(`WAGR sheet request 409 ${code}`, async () => {
  vi.useFakeTimers(); h.invoke.mockResolvedValueOnce({ data: h.lookup, error: null }).mockResolvedValueOnce({ error: { context: new Response(JSON.stringify({ code }), { status: 409 }) } });
  mount(<WagrLinkSheet userId="member" open onClose={vi.fn()} />); await typeLookup(); fireEvent.click(screen.getByRole('button', { name: 'Send for checking' })); await act(async () => { await vi.advanceTimersByTimeAsync(0); }); expect(screen.getByRole('alert')).toHaveTextContent(message);
});
it('WAGR visibility updates optimistically, disables saving and refreshes result caches', async () => {
  const v = provider(); const hook = renderHook(() => useShowTourResults('member'), { wrapper: v.wrapper }); await waitFor(() => expect(hook.result.current.disabled).toBe(false));
  let resolve: (value: any) => void = () => {}; h.write.mockImplementation(() => new Promise(r => { resolve = r; }));
  act(() => hook.result.current.toggle(false)); await waitFor(() => expect(hook.result.current.checked).toBe(false)); expect(hook.result.current.disabled).toBe(true);
  const invalidate = vi.spyOn(v.client, 'invalidateQueries'); await act(async () => resolve({ data: { show_tour_results: false }, error: null }));
  await waitFor(() => expect(hook.result.current.saving).toBe(false)); expect(h.write).toHaveBeenCalledWith({ show_tour_results: false }); expect(invalidate).toHaveBeenCalledWith({ queryKey: ['pro-profile'] }); expect(invalidate).toHaveBeenCalledWith({ queryKey: ['amateur-summary', 'member'] });
});
for (const mismatch of [false, true]) it(`WAGR visibility rolls back ${mismatch ? 'read-back mismatch' : 'write error'}`, async () => {
  const v = provider(); const hook = renderHook(() => useShowTourResults('member'), { wrapper: v.wrapper }); await waitFor(() => expect(hook.result.current.disabled).toBe(false));
  h.write.mockResolvedValue({ data: { show_tour_results: true }, error: mismatch ? null : new Error('denied') }); act(() => hook.result.current.toggle(false));
  await waitFor(() => expect(h.toast).toHaveBeenCalled()); expect(hook.result.current.checked).toBe(true);
});
it('WAGR visibility treats null as enabled', async () => { h.visibility = null; const v = provider(); const hook = renderHook(() => useShowTourResults('member'), { wrapper: v.wrapper }); await waitFor(() => expect(hook.result.current.disabled).toBe(false)); expect(hook.result.current.checked).toBe(true); });
it('Tour results card omits update wording when no official rank exists', () => { mount(<SettingsTourResultsCard userId="member" />); expect(screen.getByText('Official World Golf Ranking')).toBeInTheDocument(); });
it('Tour results card reuses official ranking date update wording', () => { h.rank = { ranking_date: new Date().toISOString() }; mount(<SettingsTourResultsCard userId="member" />); expect(screen.getByText('Official World Golf Ranking · updated today')).toBeInTheDocument(); });