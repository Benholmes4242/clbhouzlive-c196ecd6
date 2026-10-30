/**
 * Stage 2.2 addendum — no request leaves before the guest session exists.
 * The app-level hold renders no route (so nothing fetches) on a preview cold
 * start until signInAnonymously resolves; one sign-in however many holds ask.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const h = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    state: { user: null as null | { id: string; is_anonymous: boolean }, loading: false },
    listeners,
    resolve: null as null | (() => void),
    signIn: vi.fn(),
    fetchSpy: vi.fn(),
  };
});
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true, guestEnabledForHost: () => true }));
vi.mock('@/utils/native/envStatus', () => ({ useEnvStatus: () => 'preview' }));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => false }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestSessionStarted: () => {}, trackGuestSessionFailed: () => {} }));
vi.mock('@/hooks/useSupabaseSession', async () => {
  const R = await import('react');
  return { useSupabaseSession: () => R.useSyncExternalStore(cb => { h.listeners.add(cb); return () => h.listeners.delete(cb); }, () => h.state) };
});
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { signInAnonymously: () => { h.signIn(); return new Promise(r => { h.resolve = () => r({ data: {}, error: null }); }); } } },
}));

import { GuestSessionHold } from '@/features/guest/GuestSessionHold';
import { guestHoldActive, __resetGuestSignIn } from '@/features/guest/guestSession';

function Fetcher() { React.useEffect(() => { h.fetchSpy(h.state.user?.is_anonymous ?? 'no-session'); }, []); return <p>page</p>; }
const mount = (path: string) => render(<MemoryRouter initialEntries={[path]}><GuestSessionHold><Fetcher /></GuestSessionHold></MemoryRouter>);

beforeEach(() => { __resetGuestSignIn(); h.state = { user: null, loading: false }; h.signIn.mockClear(); h.fetchSpy.mockClear(); });
afterEach(cleanup);

describe('GuestSessionHold', () => {
  it('a cold deep link to /courses mounts nothing until the guest session exists', async () => {
    const { container } = mount('/courses');
    expect(container.querySelector('[data-guest-session-hold]')).not.toBeNull();
    expect(screen.queryByText('page')).toBeNull();
    expect(h.fetchSpy).not.toHaveBeenCalled();
    expect(h.signIn).toHaveBeenCalledTimes(1);
    await act(async () => { h.resolve?.(); h.state = { user: { id: 'g1', is_anonymous: true }, loading: false }; h.listeners.forEach(l => l()); });
    expect(screen.getByText('page')).toBeTruthy();
    expect(h.fetchSpy).toHaveBeenCalledWith(true);
  });

  it('two holds share one anonymous sign-in', () => {
    mount('/amateur'); mount('/tourhub');
    expect(h.signIn).toHaveBeenCalledTimes(1);
  });

  it('auth and legal pages never hold or mint a guest', () => {
    mount('/auth');
    expect(screen.getByText('page')).toBeTruthy();
    expect(h.signIn).not.toHaveBeenCalled();
  });
});

describe('guestHoldActive', () => {
  const base = { enabled: true, envStatus: 'preview', authLoading: false, hasUser: false, stored: false, guestAttempt: 'idle' as const, pathname: '/courses' };
  it('holds a signed-out preview cold start', () => expect(guestHoldActive(base)).toBe(true));
  it('releases once a session exists', () => expect(guestHoldActive({ ...base, hasUser: true })).toBe(false));
  it('releases on a failed attempt (signed-out behaviour takes over)', () => expect(guestHoldActive({ ...base, guestAttempt: 'failed' })).toBe(false));
  it('never holds with the switch off or on the web', () => {
    expect(guestHoldActive({ ...base, enabled: false })).toBe(false);
    expect(guestHoldActive({ ...base, envStatus: 'web' })).toBe(false);
  });
});
