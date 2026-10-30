/**
 * GUEST BROWSING Stage 1 — THE SIGN-IN BREAK. The sign-in path must never
 * depend on guest code: with the switch off AuthForm never reaches the guest
 * helpers, and with it on a fault in them never stops a sign-in navigating.
 * Also covers the conversion paths (link, fallback, email change) and
 * guest_user_id on the conversion event.
 * react-i18next mock copied in full per project rule.
 */
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const g = vi.hoisted(() => ({
  on: false,
  otp: vi.fn(), verify: vi.fn(), idToken: vi.fn(), link: vi.fn(), updateUser: vi.fn(),
  route: vi.fn(), apple: vi.fn(), google: vi.fn(),
  peek: vi.fn(), clear: vi.fn(), guestUser: vi.fn(), converted: vi.fn(),
}));

vi.mock('@/features/guest/guestConfig', () => ({
  get GUEST_BROWSING_ENABLED() { return g.on; },
}));
vi.mock('@/features/guest/guestConversion', () => ({
  peekGuestConversion: g.peek,
  clearGuestConversion: g.clear,
  rememberGuestConversion: vi.fn(),
}));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: g.guestUser }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestConverted: g.converted }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: g.otp, verifyOtp: g.verify, signInWithIdToken: g.idToken,
      linkIdentity: g.link, updateUser: g.updateUser,
    },
    from: vi.fn(),
  },
}));
vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: g.route }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/authAnalytics', () => ({ trackAuthMethodSelected: vi.fn(), trackAuthInitiated: vi.fn(), trackAuthFailed: vi.fn(), trackAuthException: vi.fn(), trackLoginSuccess: vi.fn(), trackSignupInitiated: vi.fn(), trackSignupSuccess: vi.fn(), trackSignupFailed: vi.fn(), trackAuthComplete: vi.fn() }));
vi.mock('@/pages/auth/components/AuthHeroScreen', () => ({ default: ({ onSubmitEmail, onAppleSignIn, onGoogleSignIn }: { onSubmitEmail: (email: string) => void; onAppleSignIn: () => void; onGoogleSignIn: () => void }) => <><button onClick={() => onSubmitEmail('member@example.test')}>Email</button><button onClick={onAppleSignIn}>Apple</button><button onClick={onGoogleSignIn}>Google</button></> }));
vi.mock('@/pages/auth/components/AuthBottomSheet', () => ({ default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => isOpen ? <section>{children}</section> : null }));
vi.mock('@/pages/auth/components/OtpSheetContent', () => ({ default: ({ onVerify }: { onVerify: (token: string) => void }) => <button onClick={() => onVerify('123456')}>Verify</button> }));

import AuthForm from '@/pages/auth/AuthForm';

const GUEST = { id: 'guest-1', is_anonymous: true };
const member = { id: 'member', last_sign_in_at: '2026-10-26T09:00:00.000Z', created_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-01T00:01:00Z', user_metadata: {} };
const ok = { data: { user: member, session: { user: member } }, error: null };

function renderAuth(entry = '/auth') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/done" element={<div data-testid="finished" />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function signIn(method: 'email' | 'apple' | 'google') {
  if (method === 'email') {
    fireEvent.click(screen.getByRole('button', { name: 'Email' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Verify' }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: method === 'apple' ? 'Apple' : 'Google' }));
  }
  await screen.findByTestId('finished');
}

beforeEach(() => {
  vi.clearAllMocks();
  g.on = false;
  g.otp.mockResolvedValue({ error: null });
  g.verify.mockResolvedValue(ok);
  g.idToken.mockResolvedValue(ok);
  g.link.mockResolvedValue(ok);
  g.updateUser.mockResolvedValue({ data: { user: GUEST }, error: null });
  g.route.mockResolvedValue('/done');
  g.peek.mockReturnValue({ guestUserId: null, surface: null });
  g.guestUser.mockReturnValue(null);
  g.apple.mockImplementation(({ callback }: { callback: (r: { idToken: string }) => void }) => callback({ idToken: 'fixture-token' }));
  g.google.mockImplementation(({ callback }: { callback: (r: { idToken: string }) => void }) => callback({ idToken: 'fixture-token' }));
  vi.stubGlobal('median', { socialLogin: { apple: { login: g.apple }, google: { login: g.google } } });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('guestConversion memory', () => {
  it('returns the remembered id and surface, and nulls after clear', async () => {
    const real = await vi.importActual<typeof import('@/features/guest/guestConversion')>('@/features/guest/guestConversion');
    expect(real.peekGuestConversion()).toEqual({ guestUserId: null, surface: null });
    real.rememberGuestConversion('guest-1', 'course:abc');
    expect(real.peekGuestConversion()).toEqual({ guestUserId: 'guest-1', surface: 'course:abc' });
    real.clearGuestConversion();
    expect(real.peekGuestConversion()).toEqual({ guestUserId: null, surface: null });
  });
});

describe('switch off: sign-in never touches guest code', () => {
  for (const method of ['email', 'apple', 'google'] as const) {
    it(`${method} signs in and navigates without peekGuestConversion or linkIdentity`, async () => {
      // Even with a guest-looking session and handoff params, nothing runs.
      g.guestUser.mockReturnValue(GUEST);
      renderAuth('/auth?guest=1');
      await signIn(method);
      expect(g.peek).not.toHaveBeenCalled();
      expect(g.link).not.toHaveBeenCalled();
      expect(g.updateUser).not.toHaveBeenCalled();
      expect(g.guestUser).not.toHaveBeenCalled();
      expect(g.converted).not.toHaveBeenCalled();
      if (method === 'email') expect(g.verify).toHaveBeenCalledWith({ email: 'member@example.test', token: '123456', type: 'email' });
      else expect(g.idToken).toHaveBeenCalledWith({ provider: method, token: 'fixture-token' });
    });
  }
});

describe('switch on: a throwing guest helper never stops a sign-in', () => {
  for (const method of ['email', 'apple', 'google'] as const) {
    it(`${method} still navigates and tracks nothing`, async () => {
      g.on = true;
      g.guestUser.mockReturnValue(GUEST);
      g.peek.mockImplementation(() => { throw new ReferenceError('surface is not defined'); });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderAuth();
      await signIn(method);
      expect(g.converted).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
    });
  }
});

describe('switch on: conversion paths', () => {
  it('Apple links the identity onto the guest and reports linked with guest_user_id', async () => {
    g.on = true;
    g.guestUser.mockReturnValue(GUEST);
    g.peek.mockReturnValue({ guestUserId: 'guest-1', surface: 'clubhouse' });
    renderAuth();
    await signIn('apple');
    expect(g.link).toHaveBeenCalledWith({ provider: 'apple', token: 'fixture-token' });
    expect(g.idToken).not.toHaveBeenCalled();
    expect(g.converted).toHaveBeenCalledWith({ method: 'apple', linked: true, surface: 'clubhouse', guestUserId: 'guest-1' });
    expect(g.clear).toHaveBeenCalled();
  });

  it('Google falls back to signInWithIdToken when linking fails, linked false', async () => {
    g.on = true;
    g.guestUser.mockReturnValue(GUEST);
    g.peek.mockReturnValue({ guestUserId: 'guest-1', surface: 'tour' });
    g.link.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Identity is already linked to another user' } });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderAuth();
    await signIn('google');
    expect(g.link).toHaveBeenCalledTimes(1);
    expect(g.idToken).toHaveBeenCalledWith({ provider: 'google', token: 'fixture-token' });
    expect(g.converted).toHaveBeenCalledWith({ method: 'google', linked: false, surface: 'tour', guestUserId: 'guest-1' });
  });

  it('email from the join card puts the email on the guest and confirms an email change', async () => {
    g.on = true;
    g.guestUser.mockReturnValue(GUEST);
    g.peek.mockReturnValue({ guestUserId: 'guest-1', surface: 'courses' });
    renderAuth('/auth?guest=1&start=email');
    await signIn('email');
    expect(g.updateUser).toHaveBeenCalledWith({ email: 'member@example.test' });
    expect(g.otp).not.toHaveBeenCalled();
    expect(g.verify).toHaveBeenCalledWith({ email: 'member@example.test', token: '123456', type: 'email_change' });
    expect(g.converted).toHaveBeenCalledWith({ method: 'email', linked: true, surface: 'courses', guestUserId: 'guest-1' });
  });

  it('email already on an account routes to the normal email sign-in', async () => {
    g.on = true;
    g.guestUser.mockReturnValue(GUEST);
    g.peek.mockReturnValue({ guestUserId: 'guest-1', surface: 'courses' });
    g.updateUser.mockResolvedValue({ data: { user: null }, error: { message: 'A user with this email address has already been registered' } });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderAuth('/auth?guest=1&start=email');
    await signIn('email');
    expect(g.otp).toHaveBeenCalledWith({ email: 'member@example.test', options: { shouldCreateUser: true } });
    expect(g.verify).toHaveBeenCalledWith({ email: 'member@example.test', token: '123456', type: 'email' });
    await waitFor(() => expect(g.converted).toHaveBeenCalledWith({ method: 'email', linked: false, surface: 'courses', guestUserId: 'guest-1' }));
  });
});
