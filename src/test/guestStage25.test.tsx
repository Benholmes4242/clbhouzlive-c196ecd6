/**
 * GUEST STAGE 2.5 — Apple and Google claim navigation before anything that
 * can turn the user into a member, so exactly one redirect fires.
 * Real Auth page, real AuthForm; react-i18next mock copied in full.
 */
import type { ReactNode } from 'react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const g = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    listeners,
    state: { user: null as null | { id: string; is_anonymous?: boolean }, loading: false },
    guest: null as null | { id: string; is_anonymous: boolean },
    link: vi.fn(), idToken: vi.fn(), refresh: vi.fn(),
    poll: vi.fn(), update: vi.fn(),
    route: vi.fn(async () => '/'),
    toastError: vi.fn(),
    apple: vi.fn(), google: vi.fn(),
  };
});
const emitUser = (user: { id: string; is_anonymous?: boolean } | null) => { g.state = { user, loading: false }; g.listeners.forEach(l => l()); };

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true, guestEnabledForHost: () => true }));
vi.mock('@/features/guest/guestConversion', () => ({
  peekGuestConversion: () => ({ guestUserId: g.guest?.id ?? null, surface: 'courses' }),
  clearGuestConversion: vi.fn(), rememberGuestConversion: vi.fn(),
}));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => g.guest }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestConverted: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', async () => {
  const R = await import('react');
  return { useSupabaseSession: () => R.useSyncExternalStore(cb => { g.listeners.add(cb); return () => g.listeners.delete(cb); }, () => g.state) };
});
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      linkIdentity: g.link, signInWithIdToken: g.idToken, refreshSession: g.refresh,
      signInWithOtp: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(),
      getSession: async () => ({ data: { session: null } }), setSession: vi.fn(),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => g.poll() }) }),
      update: (v: unknown) => ({ eq: () => ({ is: () => g.update(v) }) }),
    }),
  },
}));
vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: g.route }));
vi.mock('@/lib/toast', () => ({ toast: { error: g.toastError } }));
vi.mock('@/lib/authAnalytics', () => ({ trackAuthMethodSelected: vi.fn(), trackAuthInitiated: vi.fn(), trackAuthFailed: vi.fn(), trackAuthException: vi.fn(), trackLoginSuccess: vi.fn(), trackSignupInitiated: vi.fn(), trackSignupSuccess: vi.fn(), trackSignupFailed: vi.fn(), trackAuthComplete: vi.fn() }));
vi.mock('@/pages/auth/components/AuthHeroScreen', () => ({ default: ({ onAppleSignIn, onGoogleSignIn }: { onAppleSignIn: () => void; onGoogleSignIn: () => void }) => <><button onClick={onAppleSignIn}>Apple</button><button onClick={onGoogleSignIn}>Google</button></> }));
vi.mock('@/pages/auth/components/AuthBottomSheet', () => ({ default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => isOpen ? <section>{children}</section> : null }));
vi.mock('@/pages/auth/components/OtpSheetContent', () => ({ default: () => null }));

import Auth from '@/pages/Auth';

const GUEST = { id: 'g1', is_anonymous: true };
const MEMBER = { id: 'm1', is_anonymous: false, last_sign_in_at: '2026-10-26T09:00:00Z', created_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-01T00:01:00Z', user_metadata: {} as Record<string, unknown> };
const session = (user = MEMBER) => ({ data: { user, session: { user } }, error: null });
function deferred<T>() { let resolve!: (v: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

let navs: string[] = [];
function Tracker() { const l = useLocation(); React.useEffect(() => { navs.push(l.pathname); }, [l.key]); return null; }
const mount = () => render(
  <MemoryRouter initialEntries={['/auth']}>
    <Tracker />
    <Routes><Route path="/auth" element={<Auth />} /><Route path="/" element={<div data-testid="home" />} /></Routes>
  </MemoryRouter>,
);
const flush = () => act(async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); });

beforeEach(() => {
  vi.clearAllMocks(); navs = []; g.route.mockResolvedValue('/');
  g.update.mockResolvedValue({ error: null });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('median', { socialLogin: {
    apple: { login: ({ callback }: { callback: (r: unknown) => void }) => g.apple(callback) },
    google: { login: ({ callback }: { callback: (r: unknown) => void }) => g.google(callback) },
  } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Stage 2.5 — Apple and Google claim navigation first', () => {
  it('a. Apple, guest links: no redirect while the profile poll is pending, then exactly one', async () => {
    g.guest = GUEST; emitUser(GUEST);
    g.link.mockResolvedValue(session());
    g.refresh.mockImplementation(async () => { emitUser(MEMBER); return { data: { session: { user: MEMBER } }, error: null }; });
    const poll = deferred<{ data: unknown; error: null }>();
    g.poll.mockReturnValue(poll.promise);
    g.apple.mockImplementation((cb: (r: unknown) => void) => cb({ idToken: 'h.e30.s' }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Apple' }));
    await flush();
    expect(g.refresh).toHaveBeenCalled();
    expect(g.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth']);
    poll.resolve({ data: { id: 'm1' }, error: null });
    await waitFor(() => expect(screen.getByTestId('home')).toBeTruthy());
    expect(g.route).toHaveBeenCalledTimes(1);
    expect(navs).toEqual(['/auth', '/']);
  });

  it('b. Google, link fails and falls back: no navigation until the avatar harvest resolves, then one', async () => {
    g.guest = GUEST; emitUser(GUEST);
    g.link.mockResolvedValue({ data: null, error: { message: 'identity_already_exists' } });
    const withPhoto = { ...MEMBER, user_metadata: { picture: 'https://example.test/p.jpg' } };
    g.idToken.mockImplementation(async () => { emitUser(withPhoto); return session(withPhoto); });
    const harvest = deferred<{ error: null }>();
    g.update.mockReturnValue(harvest.promise);
    g.google.mockImplementation((cb: (r: unknown) => void) => cb({ idToken: 'h.e30.s' }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Google' }));
    await flush();
    expect(g.update).toHaveBeenCalledWith({ profile_photo_url: 'https://example.test/p.jpg' });
    expect(g.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth']);
    harvest.resolve({ error: null });
    await waitFor(() => expect(screen.getByTestId('home')).toBeTruthy());
    expect(g.route).toHaveBeenCalledTimes(1);
    expect(navs).toEqual(['/auth', '/']);
  });

  it('c. Apple, signed-out visitor: none before the name persist resolves, then one', async () => {
    g.guest = null; emitUser(null);
    g.idToken.mockImplementation(async () => { emitUser(MEMBER); return session(); });
    const persist = deferred<{ error: null }>();
    g.update.mockReturnValue(persist.promise);
    g.apple.mockImplementation((cb: (r: unknown) => void) => cb({ idToken: 'h.e30.s', firstName: 'Ann' }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Apple' }));
    await flush();
    expect(g.link).not.toHaveBeenCalled();
    expect(g.update).toHaveBeenCalledWith({ first_name: 'Ann' });
    expect(g.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth']);
    persist.resolve({ error: null });
    await waitFor(() => expect(screen.getByTestId('home')).toBeTruthy());
    expect(g.route).toHaveBeenCalledTimes(1);
    expect(navs).toEqual(['/auth', '/']);
  });

  it('d. Apple, guest links but the conversion refresh fails: stays on /auth, no navigation', async () => {
    g.guest = GUEST; emitUser(GUEST);
    g.link.mockResolvedValue(session());
    g.refresh.mockResolvedValue({ data: { session: null }, error: new Error('refresh failed') });
    g.apple.mockImplementation((cb: (r: unknown) => void) => { void Promise.resolve(cb({ idToken: 'h.e30.s' })).catch(() => {}); });
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Apple' }));
    await flush();
    expect(g.route).not.toHaveBeenCalled();
    expect(navs).toEqual(['/auth']);
    expect(g.toastError).toHaveBeenCalled();
  });
});
