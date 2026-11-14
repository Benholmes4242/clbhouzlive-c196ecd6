import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const h = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn(), notification: vi.fn(), calls: [] as string[], failed: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: h.rpc, functions: { invoke: h.invoke }, auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
  from: (table: string) => {
    if (table === 'notifications') return { insert: h.notification };
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'neq', 'eq', 'order', 'in']) chain[method] = () => chain;
    chain.then = (resolve: (value: unknown) => void) => Promise.resolve({ data: table === 'amateur_rank_links' ? [{ user_id: 'am', status: 'pending', requested_at: '2026-11-14', reviewed_at: null, review_note: null, wagr_name: 'Lewy', wagr_country: 'England', wagr_slug: 'lewy-41967' }, { user_id: 'verified', status: 'verified', requested_at: '2026-11-13' }] : table === 'user_profiles' ? [{ id: 'am', display_name: 'Member' }] : [], error: h.failed && table === 'amateur_rank_links' ? new Error('denied') : null }).then(resolve);
    return chain;
  },
} }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
import { fetchVerifications, reviewWagrClaim, useVerifications } from '@/features/admin/hooks/useVerifications';
beforeEach(() => { vi.clearAllMocks(); h.calls = []; h.failed = false; h.rpc.mockImplementation(async () => { h.calls.push('rpc'); return { data: {}, error: null }; }); h.notification.mockImplementation(async () => { h.calls.push('notification'); return { error: null }; }); h.invoke.mockImplementation(async () => { h.calls.push('sync'); return { data: { errored: 0 }, error: null }; }); });
afterEach(cleanup);
it('WAGR pending claims have their own count and do not inflate pro/golfer counts', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useVerifications(), { wrapper });
  await waitFor(() => expect(hook.result.current.counts.wagr).toBe(1));
  expect(hook.result.current.counts.pro).toBe(0); expect(hook.result.current.counts.golfer).toBe(0);
  expect(hook.result.current.data.find(row => row.id === 'am')).toMatchObject({ type: 'wagr', wagrName: 'Lewy', displayName: 'Member' });
  hook.unmount(); client.clear();
});
it('WAGR approval calls review RPC before invoking targeted sync', async () => {
  await reviewWagrClaim('am', true, 'Confirmed');
  expect(h.calls).toEqual(['rpc', 'notification', 'sync']);
  expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'am', recipient_actor_type: 'user', recipient_actor_id: 'am', actor_id: 'admin', type: 'moderation', title: 'WAGR profile linked', message: 'Your World Amateur Golf Ranking is now on your profile, with the AM badge.' }));
  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: true, p_note: 'Confirmed' });
  expect(h.invoke).toHaveBeenCalledWith('sync-amateur-rankings', { body: { user_id: 'am' } });
});
it('WAGR rejection records the note and never invokes sync', async () => {
  await reviewWagrClaim('am', false, 'Different person'); expect(h.invoke).not.toHaveBeenCalled();
  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: false, p_note: 'Different person' });
  expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ title: 'WAGR link not confirmed', message: "We couldn't confirm that WAGR profile is yours. You can try again from Settings." }));
});
it('WAGR failed approval RPC never invokes sync', async () => {
  h.rpc.mockResolvedValue({ data: null, error: new Error('denied') });
  await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('denied'); expect(h.invoke).not.toHaveBeenCalled();
});
it('WAGR failed queue read is not treated as no claims', async () => {
  h.failed = true; await expect(fetchVerifications()).rejects.toThrow('denied');
});
it('WAGR notification failure warns without failing the review or skipping sync', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  h.notification.mockResolvedValue({ error: new Error('notification denied') });
  await reviewWagrClaim('am', true, '');
  expect(warn).toHaveBeenCalled(); expect(h.invoke).toHaveBeenCalled(); warn.mockRestore();
});
it('WAGR approval notifies even when the following sync fails', async () => {
  h.invoke.mockResolvedValue({ error: new Error('sync blocked') });
  await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('sync blocked');
  expect(h.calls).toEqual(['rpc', 'notification']); expect(h.notification).toHaveBeenCalled();
});