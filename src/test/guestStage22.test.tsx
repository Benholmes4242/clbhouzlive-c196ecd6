/**
 * GUEST STAGE 2.2 — a guest keeps their id when they join. Every query that
 * guests skip carries the guest flag in its key, so the is_anonymous flip
 * alone (same id, no reload, no invalidateQueries) refetches it.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    user: { id: 'u1', is_anonymous: true } as { id: string; is_anonymous: boolean },
    listeners,
    profileReads: 0,
    rpc: vi.fn(),
    convert() {
      // Same id; only the anonymous flag flips — exactly what updateUser does.
      h.user = { id: 'u1', is_anonymous: false };
      listeners.forEach(l => l());
    },
  };
});

vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true, guestEnabledForHost: () => true }));
vi.mock('@/hooks/useSupabaseSession', async () => {
  const R = await import('react');
  return {
    useSupabaseSession: () => {
      const user = R.useSyncExternalStore(
        cb => { h.listeners.add(cb); return () => h.listeners.delete(cb); },
        () => h.user,
      );
      return { user, session: null, loading: false };
    },
  };
});
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: h.user } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => { h.profileReads += 1; return Promise.resolve({ data: { id: 'u1' }, error: null }); } }) }),
    }),
    rpc: (name: string, args: unknown) => { h.rpc(name, args); return Promise.resolve({ data: [], error: null }); },
  },
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', () => ({ useGalleryCourseMedia: () => ({ data: undefined, isError: false }) }));

import { useProfileData } from '@/hooks/useProfileData';
import { useFeatsWindow } from '@/features/explore-magazine/useFeatsWindow';
import { LatestCoursesSection } from '@/components/courses/browse/LatestCoursesSection';
import { LatestHolesSection } from '@/components/courses/browse/LatestHolesSection';

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: true } } });
const wrap = (c: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter><QueryClientProvider client={c}>{children}</QueryClientProvider></MemoryRouter>
);
const calls = (name: string) => h.rpc.mock.calls.filter(([n]) => n === name).length;

beforeEach(() => { h.user = { id: 'u1', is_anonymous: true }; h.profileReads = 0; h.rpc.mockClear(); });
afterEach(cleanup);

describe('Guest Stage 2.2 — conversion refetches guest-skipped queries', () => {
  it('useProfileData reads the profile after the guest converts, same id, no reload', async () => {
    const c = client();
    const { result } = renderHook(() => useProfileData(), { wrapper: wrap(c) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(h.profileReads).toBe(0);
    expect(result.current.profile ?? null).toBeNull();
    act(() => h.convert());
    await waitFor(() => expect(result.current.profile).toEqual({ id: 'u1' }));
    expect(h.profileReads).toBe(1);
  });

  it('get_feats_window fires after conversion', async () => {
    const c = client();
    renderHook(() => useFeatsWindow('u1', 'year'), { wrapper: wrap(c) });
    await new Promise(r => setTimeout(r, 0));
    expect(calls('get_feats_window')).toBe(0);
    act(() => h.convert());
    await waitFor(() => expect(calls('get_feats_window')).toBe(1));
  });

  it('get_latest_course_media and get_latest_hole_media fire after conversion', async () => {
    const c = client();
    render(<><LatestCoursesSection /><LatestHolesSection /></>, { wrapper: wrap(c) });
    await new Promise(r => setTimeout(r, 0));
    expect(calls('get_latest_course_media')).toBe(0);
    expect(calls('get_latest_hole_media')).toBe(0);
    act(() => h.convert());
    await waitFor(() => {
      expect(calls('get_latest_course_media')).toBe(1);
      expect(calls('get_latest_hole_media')).toBe(1);
    });
  });

  it('every guest-skipped key ends [..., userId, isGuest]', async () => {
    const { readFileSync } = await import('node:fs');
    const src = (p: string) => readFileSync(p, 'utf8');
    expect(src('src/hooks/useProfileData.ts')).toContain("['profile', user?.id, isGuest]");
    expect(src('src/features/explore-magazine/useFeatsWindow.ts')).toContain("userId, window, isGuest]");
    expect(src('src/components/courses/browse/LatestCoursesSection.tsx')).toContain("'infinite', user?.id, isGuest]");
    expect(src('src/components/courses/browse/LatestHolesSection.tsx')).toContain("'infinite', user?.id, isGuest]");
    expect(src('src/hooks/gam/useCircleLatestRounds.ts')).toMatch(/'circle-latest-rounds',\s*userId,\s*isGuest,/);
    expect(src('src/context/TopTenContext.tsx')).toContain('[loadUserId, loadIsGuest]');
  });
});
