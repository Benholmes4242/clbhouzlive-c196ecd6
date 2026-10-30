/**
 * GUEST STAGE 2.4 — a guest is signed out as far as sign-in is concerned, so
 * /auth never loops through /welcome and the route guard.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const h = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    listeners,
    state: { user: null as null | { id: string; is_anonymous?: boolean }, loading: false },
    route: vi.fn(async () => '/'),
    getSession: vi.fn(async () => ({ data: { session: null as unknown } })),
  };
});
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', async () => {
  const R = await import('react');
  return { useSupabaseSession: () => R.useSyncExternalStore(cb => { h.listeners.add(cb); return () => h.listeners.delete(cb); }, () => h.state) };
});
vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: h.route }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: h.getSession, setSession: vi.fn(), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } } }));
vi.mock('@/pages/auth/AuthForm', async () => {
  const { useSearchParams } = await import('react-router-dom');
  return { default: () => { const [p] = useSearchParams(); return <div data-testid="auth-form" data-step={p.get('guest') === '1' ? `join-${p.get('start')}` : 'sign-in'} />; } };
});
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => h.state.user?.is_anonymous === true, isGuestUser: (u: { is_anonymous?: boolean } | null) => u?.is_anonymous === true }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true, guestEnabledForHost: () => true }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestGateShown: () => {} }));

import Auth from '@/pages/Auth';
import { GuestRouteGuard, __resetGuestReturnPath } from '@/features/guest/guestRoutes';

let navs: string[] = [];
function Tracker() { const l = useLocation(); React.useEffect(() => { navs.push(l.pathname + l.search); }, [l.key]); return null; }
let go: (to: string) => void = () => {};
function Nav() { const n = useNavigate(); go = n; return null; }
const setUser = (user: typeof h.state.user) => act(() => { h.state = { user, loading: false }; h.listeners.forEach(l => l()); });
const guest = { id: 'g1', is_anonymous: true };
const mount = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Tracker /><Nav /><GuestRouteGuard />
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/welcome" element={<div data-testid="welcome" />} />
      <Route path="/courses" element={<div data-testid="courses" />} />
      <Route path="/settings" element={<div data-testid="settings" />} />
      <Route path="/" element={<div data-testid="home" />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { navs = []; h.state = { user: guest, loading: false }; h.route.mockClear(); h.route.mockResolvedValue('/'); __resetGuestReturnPath(); });
afterEach(cleanup);

describe('Stage 2.4 — guests on /auth', () => {
  it('a guest on /auth sees the sign-in form and is not navigated', async () => {
    mount('/auth');
    expect(screen.getByTestId('auth-form').getAttribute('data-step')).toBe('sign-in');
    await act(async () => { await Promise.resolve(); });
    expect(h.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth']);
  });

  it('a guest on /auth?guest=1&start=email reaches the email join step', async () => {
    mount('/auth?guest=1&start=email');
    expect(screen.getByTestId('auth-form').getAttribute('data-step')).toBe('join-email');
    await act(async () => { await Promise.resolve(); });
    expect(h.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth?guest=1&start=email']);
  });

  it('after a guest signs in as a member, Auth redirects once', async () => {
    mount('/auth');
    setUser({ id: 'm1', is_anonymous: false });
    await waitFor(() => expect(screen.getByTestId('home')).toBeTruthy());
    setUser({ id: 'm1', is_anonymous: false });
    expect(h.route).toHaveBeenCalledTimes(1);
    expect(h.route).toHaveBeenCalledWith('m1', null);
    expect(navs).toEqual(['/auth', '/']);
  });

  it('a guest on a blocked route from /auth goes to the last surface, not /auth', () => {
    mount('/courses');
    act(() => go('/auth'));
    act(() => go('/settings'));
    expect(screen.getByTestId('courses')).toBeTruthy();
    expect(navs).toEqual(['/courses', '/auth', '/settings', '/courses']);
  });

  it('with no surface browsed, a blocked route from /auth goes to /', () => {
    mount('/auth');
    act(() => go('/welcome'));
    expect(screen.getByTestId('home')).toBeTruthy();
    expect(navs).toEqual(['/auth', '/welcome', '/']);
  });
});
