import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let handler: (() => void) | null = null;
const removeChannel = vi.fn();
vi.mock('@/integrations/supabase/client', () => {
  const channel: any = {
    on: (_e: string, _f: unknown, cb: () => void) => { handler = cb; return channel; },
    subscribe: () => channel,
  };
  return { supabase: { channel: () => channel, removeChannel: (...a: unknown[]) => removeChannel(...a) } };
});

import { useLeaderboardRealtime, LEADERBOARD_REALTIME_COALESCE_MS } from '@/features/tourhub/hooks/useLeaderboardRealtime';

function setup(tid: string | null, opts?: { invalidate?: 'all' | 'leaderboard' }) {
  const qc = new QueryClient();
  const spy = vi.spyOn(qc, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const r = renderHook(({ id }) => useLeaderboardRealtime(id, opts), { wrapper, initialProps: { id: tid } });
  return { spy, ...r };
}

describe('useLeaderboardRealtime coalescing', () => {
  beforeEach(() => { vi.useFakeTimers(); handler = null; });
  afterEach(() => vi.useRealTimers());

  it('window is 4000ms', () => expect(LEADERBOARD_REALTIME_COALESCE_MS).toBe(4000));

  it('144-row burst on the hero yields one invalidation', () => {
    const { spy } = setup('t1', { invalidate: 'leaderboard' });
    for (let i = 0; i < 144; i++) handler!();
    expect(spy).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(4000);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('144-row burst on the tournament page yields all nine groups once', () => {
    const { spy } = setup('t1');
    for (let i = 0; i < 144; i++) handler!();
    vi.advanceTimersByTime(4000);
    expect(spy).toHaveBeenCalledTimes(9);
  });

  it('a single isolated change still lands after the window', () => {
    const { spy } = setup('t1', { invalidate: 'leaderboard' });
    handler!();
    vi.advanceTimersByTime(3999);
    expect(spy).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('unmount cancels a pending flush', () => {
    const { spy, unmount } = setup('t1');
    handler!();
    unmount();
    vi.advanceTimersByTime(10000);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('changing tournament cancels the old pending flush', () => {
    const { spy, rerender } = setup('t1', { invalidate: 'leaderboard' });
    handler!();
    rerender({ id: 't2' });
    vi.advanceTimersByTime(10000);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
