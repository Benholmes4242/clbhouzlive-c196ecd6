/**
 * GUEST STAGE 2.1 — the three failing preview requests.
 *
 * 1. TopTenContext must not upsert on mount (only after a real change) and
 *    must never upsert for a guest.
 * 2. usePostLikers must select business_accounts.category (business_type does
 *    not exist and 400'd for members too).
 * 3. useProfileData must never read a guest's own user_profiles row.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  anonymous: false,
  getUser: vi.fn(),
  upsert: vi.fn(),
  selectArgs: [] as string[],
  fromCalls: [] as string[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: h.getUser },
    from: (table: string) => {
      h.fromCalls.push(table);
      if (table === 'user_top_ten_lists') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
          upsert: h.upsert,
        };
      }
      if (table === 'business_accounts') {
        return {
          select: (cols: string) => {
            h.selectArgs.push(cols);
            return { in: () => Promise.resolve({ data: [{ id: 'b1', category: 'golf_club' }], error: null }) };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
    rpc: () => Promise.resolve({ data: [], error: null }),
  },
}));

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'u1', is_anonymous: h.anonymous }, loading: false }),
}));
vi.mock('@/hooks/usePostLikes', () => ({
  usePostLikes: () => ({
    data: [{ actorId: 'b1', userId: 'b1', actorType: 'business', displayName: 'Club', username: 'club' }],
    isLoading: false,
  }),
}));
vi.mock('@/hooks/useBlockedUserIds', () => ({ useBlockedUserIds: () => new Set<string>() }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));

import { TopTenProvider, useTopTen } from '@/context/TopTenContext';
import { usePostLikers } from '@/hooks/usePostLikers';
import { useProfileData } from '@/hooks/useProfileData';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  h.anonymous = false;
  h.selectArgs = [];
  h.fromCalls = [];
  h.getUser.mockResolvedValue({ data: { user: { id: 'u1', is_anonymous: h.anonymous } } });
  h.upsert.mockResolvedValue({ error: null });
});

describe('TopTenContext persist', () => {
  const course = { id: 'c1', name: 'Course One' };

  it('does not upsert on mount after loading finishes', async () => {
    render(<TopTenProvider><div /></TopTenProvider>);
    await waitFor(() => expect(h.getUser).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 600));
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it('upserts after the member changes the list', async () => {
    let api: ReturnType<typeof useTopTen> | null = null;
    const Probe = () => { api = useTopTen(); return null; };
    render(<TopTenProvider><Probe /></TopTenProvider>);
    await waitFor(() => expect(api?.loading).toBe(false));
    act(() => api!.addCourse(course));
    await waitFor(() => expect(h.upsert).toHaveBeenCalledTimes(1), { timeout: 1500 });
  });

  it('never upserts for a guest', async () => {
    h.anonymous = true;
    h.getUser.mockResolvedValue({ data: { user: { id: 'g1', is_anonymous: true } } });
    let api: ReturnType<typeof useTopTen> | null = null;
    const Probe = () => { api = useTopTen(); return null; };
    render(<TopTenProvider><Probe /></TopTenProvider>);
    await waitFor(() => expect(api?.loading).toBe(false));
    act(() => api!.addCourse(course));
    await new Promise((r) => setTimeout(r, 600));
    expect(h.upsert).not.toHaveBeenCalled();
  });
});

describe('usePostLikers business enrichment', () => {
  it('selects id, category from business_accounts and maps category', async () => {
    const { result } = renderHook(() => usePostLikers('p1', true), { wrapper });
    await waitFor(() => expect(result.current.likers[0]?.businessType).toBe('golf_club'));
    expect(h.selectArgs).toContain('id, category');
    expect(h.selectArgs.join(' ')).not.toContain('business_type');
  });
});

describe('useProfileData guest', () => {
  it('returns no profile for a guest without reading user_profiles', async () => {
    h.anonymous = true;
    const { result } = renderHook(() => useProfileData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(h.fromCalls).not.toContain('user_profiles');
  });

  it('still reads the profile for a member', async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper });
    await waitFor(() => expect(h.fromCalls).toContain('user_profiles'));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
