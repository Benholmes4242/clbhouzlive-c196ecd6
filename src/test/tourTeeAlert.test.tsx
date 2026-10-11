import { describe, expect, it } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { tourOptimisticToggle } from '@/features/tourhub/hooks/tourOptimisticToggle';
import { TeeAlertControl } from '@/features/tourhub/components/overview-v3/HybridHeroBands/TeeAlertButton';
import { confirmedLastGroup, dispatchTeeAlerts, enqueueAndStamp } from '../../supabase/functions/tournament-live-sync/teeAlerts';
import en from '../../public/locales/en/tourhub.json';

vi.mock('react-i18next', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-i18next')>(),
  useTranslation: () => ({ t: (key: string) => {
    const value = key.split('.').reduce<unknown>((node, part) =>
      node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined, en);
    return typeof value === 'string' ? value : key;
  } }),
}));
afterEach(cleanup);

describe('Tee alert toggle', () => {
  it('shows the unarmed label with aria-pressed false and toggles', () => {
    const toggle = vi.fn();
    render(<MemoryRouter><TeeAlertControl armed={false} needsNotifications={false} onToggle={toggle} /></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Tell me when they tee off' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button); expect(toggle).toHaveBeenCalledOnce();
  });
  it('shows the armed label with aria-pressed true', () => {
    render(<MemoryRouter><TeeAlertControl armed needsNotifications={false} onToggle={() => {}} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'You will be told when they tee off' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('links the delivery warning to notification settings', () => {
    render(<MemoryRouter><TeeAlertControl armed needsNotifications onToggle={() => {}} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: '— turn on notifications' })).toHaveAttribute('href', '/manage/notifications');
  });
});

describe('Tee alert dispatch', () => {
  const early = { tee_time: '2026-10-11T10:00:00Z', players: [{ player: { id: 'leader', full_name: 'Alex Archer' } }] };
  const last = { tee_time: '2026-10-11T14:00:00Z', players: [{ player: { id: 'other', full_name: 'Ben Brooks' } }] };
  it('does not enqueue when the leader is not in the last drawn group', async () => {
    const insert = vi.fn();
    const results: Record<string, unknown> = { sr_tee_times: [early, last], sr_leaderboards: [{ player_id: 'leader' }], sr_tournaments: { timezone: 'UTC' } };
    const db = { rpc: async () => ({ data: [{ user_id: 'u', tournament_id: 't', round: 4, tee_time: last.tee_time }], error: null }),
      from: (table: string) => {
        const chain: Record<string, unknown> = { insert };
        for (const method of ['select', 'eq', 'order', 'maybeSingle']) chain[method] = () => chain;
        chain.then = (resolve: (value: unknown) => void) => resolve({ data: results[table], error: null });
        return chain;
      } };
    await dispatchTeeAlerts(db);
    expect(insert).not.toHaveBeenCalled();
  });
  it('confirms the leader by id, including simultaneous two-tee groups', () => {
    expect(confirmedLastGroup([early, last], ['leader'], last.tee_time)).toBeNull();
    expect(confirmedLastGroup([early, last], ['other'], last.tee_time)).toEqual(last);
    expect(confirmedLastGroup([{ ...early, tee_time: last.tee_time }, last], ['leader'], last.tee_time)?.players?.[0].player?.id).toBe('leader');
  });
  it('stamps even when enqueue fails', async () => {
    const stamp = vi.fn(async () => {});
    await expect(enqueueAndStamp(async () => { throw new Error('queue failed'); }, stamp)).rejects.toThrow('queue failed');
    expect(stamp).toHaveBeenCalledOnce();
  });
});