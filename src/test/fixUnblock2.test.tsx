import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const f = vi.hoisted(() => ({ profile: {} as Record<string, unknown>, loading: false, requestStarted: vi.fn() }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: f.profile, loading: f.loading }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: true, connected: true, settled: true, connection: { id: 'kept' }, trend: { current: 12.4 }, anyError: false }) }));
vi.mock('@/features/pro-verification/proMembersCache', () => ({ invalidateProMembers: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const chain = { select: () => chain, eq: () => chain, in: () => chain, order: () => chain, limit: () => chain, maybeSingle: () => { f.requestStarted(); return new Promise(() => {}); } };
  return chain;
} } }));

import { useMyProStatus } from '@/features/pro-verification/useMyProStatus';
import { useOwnHandicapState } from '@/lib/whs/useOwnHandicapState';

let qc: QueryClient;
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={qc}>{children}</QueryClientProvider>; }
beforeEach(() => { f.profile = {}; f.loading = false; vi.clearAllMocks(); qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); qc.clear(); });

describe('FIX_UNBLOCK_2 island-only verification readiness', () => {
  it('settles the amateur island while the request remains pending', async () => {
    const { result } = renderHook(() => ({ island: useOwnHandicapState('me', { island: true }), other: useOwnHandicapState('me') }), { wrapper: Wrapper });
    await waitFor(() => expect(f.requestStarted).toHaveBeenCalledOnce());
    expect(result.current.island.settled).toBe(true);
    expect(result.current.island.pro).toBe(false);
    expect(result.current.other.settled).toBe(false);
  });
  it('shows verified pro and profile tour without waiting for the request', async () => {
    f.profile = { pro_verified_at: '2026-11-05T12:00:00Z', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_club: 'Sundridge Park' };
    const { result } = renderHook(() => useOwnHandicapState('me', { island: true }), { wrapper: Wrapper });
    await waitFor(() => expect(f.requestStarted).toHaveBeenCalledOnce());
    expect(result.current.settled).toBe(true);
    expect(result.current.pro).toBe(true);
    expect(result.current.proTour).toBe('Alps Tour');
    expect(result.current.proClub).toBe('Sundridge Park');
  });
  it('keeps the island unsettled while the profile is loading', () => {
    f.loading = true;
    const { result } = renderHook(() => useOwnHandicapState('me', { island: true }), { wrapper: Wrapper });
    expect(result.current.settled).toBe(false);
  });
  it('preserves unknown while the request query is pending', async () => {
    const { result } = renderHook(() => useMyProStatus('me'), { wrapper: Wrapper });
    await waitFor(() => expect(f.requestStarted).toHaveBeenCalledOnce());
    expect(result.current.verifiedKnown).toBe(true);
    expect(result.current.unknown).toBe(true);
  });
});