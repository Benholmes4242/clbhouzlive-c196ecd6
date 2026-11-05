import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminProWorldRanking } from '@/features/admin/components/AdminProWorldRanking';
const h = vi.hoisted(() => ({ source: null as null | { owgr_url: string; last_checked_at: string; last_error: string | null }, rank: null as null | { rank: number; ranking_date: string }, refusal: null as null | string, calls: [] as string[], invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: h.source, error: null }) }) }) }),
  rpc: async (name: string, args: { p_user_id: string; p_owgr_url?: string }) => {
    if (name === 'get_pro_world_rank') return { data: h.rank, error: null };
    h.calls.push(name); expect(args.p_user_id).toBe('pro');
    return { data: { owgr_slug: 'mason-essam-31930' }, error: h.refusal ? { message: h.refusal } : null };
  },
  functions: { invoke: (...args: unknown[]) => { h.calls.push('check'); return h.invoke(...args); } },
} }));
beforeEach(() => { h.source = null; h.rank = null; h.refusal = null; h.calls = []; h.invoke.mockReset(); h.invoke.mockResolvedValue({ data: { checked: 1, updated: 1, failed: [] }, error: null }); });
afterEach(cleanup);
describe('Admin pro world ranking', () => {
  it('empty link saves through RPC then checks only that pro', async () => {
    render(<AdminProWorldRanking userId="pro" />);
    const input = await screen.findByRole('textbox', { name: 'OWGR profile link' });
    fireEvent.change(input, { target: { value: 'https://www.owgr.com/playerprofile/mason-essam-31930' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.calls).toEqual(['admin_set_pro_owgr', 'check']));
    expect(h.invoke).toHaveBeenCalledWith('sync-pro-world-rankings', { body: { user_id: 'pro' } });
  });
  it('set link shows returned rank/date and provides check/change actions', async () => {
    h.source = { owgr_url: 'https://www.owgr.com/playerprofile/test', last_checked_at: '2026-11-05T20:00:00Z', last_error: null }; h.rank = { rank: 1436, ranking_date: '2026-11-01' };
    render(<AdminProWorldRanking userId="pro" />);
    expect(await screen.findByTestId('pro-world-rank')).toHaveTextContent('#1436 · 2026-11-01');
    fireEvent.click(screen.getByRole('button', { name: 'Change link' }));
    expect(screen.getByRole('textbox', { name: 'OWGR profile link' })).toHaveValue(h.source.owgr_url);
  });
  it('set link shows the saved check error', async () => {
    h.source = { owgr_url: 'https://www.owgr.com/playerprofile/test', last_checked_at: '2026-11-05T20:00:00Z', last_error: 'Timed out' };
    render(<AdminProWorldRanking userId="pro" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Timed out');
  });
  it('RPC refusal is shown as-is and never triggers check now', async () => {
    h.refusal = 'That is not an owgr.com link'; render(<AdminProWorldRanking userId="pro" />);
    fireEvent.change(await screen.findByRole('textbox', { name: 'OWGR profile link' }), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(h.refusal);
    expect(h.calls).toEqual(['admin_set_pro_owgr']); expect(h.invoke).not.toHaveBeenCalled();
  });
});