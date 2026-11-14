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
it('WAGR approval calls review RPC then targeted sync without a notifications insert', async () => {
  await reviewWagrClaim('am', true, 'Confirmed');
  expect(h.calls).toEqual(['rpc', 'sync']);
  expect(h.notification).not.toHaveBeenCalled();
  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: true, p_note: 'Confirmed' });
  expect(h.invoke).toHaveBeenCalledWith('sync-amateur-rankings', { body: { user_id: 'am' } });
});
it('WAGR rejection calls review RPC without a notifications insert or sync', async () => {
  await reviewWagrClaim('am', false, 'Different person'); expect(h.invoke).not.toHaveBeenCalled();
  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: false, p_note: 'Different person' });
  expect(h.calls).toEqual(['rpc']);
  expect(h.notification).not.toHaveBeenCalled();
});
it('WAGR failed approval RPC never invokes sync', async () => {
  h.rpc.mockResolvedValue({ data: null, error: new Error('denied') });
  await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('denied'); expect(h.invoke).not.toHaveBeenCalled();
  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: true, p_note: '' });
  expect(h.notification).not.toHaveBeenCalled();
});
it('WAGR failed queue read is not treated as no claims', async () => {
  h.failed = true; await expect(fetchVerifications()).rejects.toThrow('denied');
});