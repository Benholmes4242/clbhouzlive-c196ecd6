/**
 * SIGNIN_FIX_1 — stop losing sign-ups at the email code and Google steps.
 * Pending-code restore/reuse, 429 handling, 60s cooldown, Google hero errors.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
const updateUser = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: (...a: unknown[]) => signInWithOtp(...a),
      verifyOtp: (...a: unknown[]) => verifyOtp(...a),
      updateUser: (...a: unknown[]) => updateUser(...a),
      getSession: (...a: unknown[]) => getSession(...a),
      onAuthStateChange: (...a: unknown[]) => onAuthStateChange(...a),
    },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })),
  },
}));

const trackAuthFailed = vi.fn();
const trackSignupFailed = vi.fn();
vi.mock('@/lib/authAnalytics', () => ({
  trackAuthMethodSelected: vi.fn(),
  trackAuthInitiated: vi.fn(),
  trackAuthFailed: (...a: unknown[]) => trackAuthFailed(...a),
  trackAuthException: vi.fn(),
  trackSignupInitiated: vi.fn(),
  trackSignupFailed: (...a: unknown[]) => trackSignupFailed(...a),
  trackSignupSuccess: vi.fn(),
  trackLoginSuccess: vi.fn(),
  trackAuthComplete: vi.fn(),
  buildAuthErrorExtras: vi.fn(() => ({})),
}));

vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: vi.fn(async () => '/') }));

const track = vi.fn();
vi.mock('@/utils/analyticsEvents', () => ({
  analyticsEvents: { track: (...a: unknown[]) => track(...a) },
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
}));

vi.mock('@/pages/auth/components/AuthHeroScreen', () => ({
  default: (p: {
    errorMessage?: string | null;
    onSubmitEmail: (e: string) => void;
    onGoogleSignIn: () => void;
  }) => (
    <div data-testid="hero">
      {p.errorMessage ? <div data-testid="hero-error">{p.errorMessage}</div> : null}
      <button data-testid="email-submit" onClick={() => p.onSubmitEmail('golfer@example.com')} />
      <button data-testid="google" onClick={p.onGoogleSignIn} />
    </div>
  ),
}));

vi.mock('@/pages/auth/components/AuthBottomSheet', () => ({
  default: (p: { isOpen: boolean; children?: unknown }) =>
    p.isOpen ? <div data-testid="sheet">{p.children as never}</div> : null,
}));

vi.mock('@/pages/auth/components/OtpSheetContent', () => ({
  default: (p: {
    infoMessage?: string | null;
    resendCooldown: number;
    onVerify: (code: string) => void;
  }) => (
    <div data-testid="otp">
      {p.infoMessage ? <div data-testid="otp-info">{p.infoMessage}</div> : null}
      <div data-testid="cooldown">{p.resendCooldown}</div>
      <button data-testid="verify" onClick={() => p.onVerify('123456')} />
    </div>
  ),
}));

import AuthForm from '@/pages/auth/AuthForm';

const PENDING_KEY = 'auth.pendingCode';
const seedPending = (email: string, ageSec: number, linkMode = false) => {
  localStorage.setItem(PENDING_KEY, JSON.stringify({ email, sentAt: Date.now() - ageSec * 1000, linkMode }));
};

const renderAuth = () =>
  render(
    <MemoryRouter>
      <AuthForm />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: null } });
  signInWithOtp.mockResolvedValue({ error: null });
  verifyOtp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
  (window as unknown as { median?: unknown }).median = undefined;
});

afterEach(() => cleanup());

describe('SIGNIN_FIX_1', () => {
  it('(a) restores a 2-minute-old pending code on mount; an 11-minute-old one does not', async () => {
    seedPending('golfer@example.com', 120);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('sheet')).toBeTruthy());
    expect(screen.getByTestId('otp-info').textContent).toBe('Enter the code we sent to golfer@example.com.');
    expect(screen.getByTestId('cooldown').textContent).toBe('0');
    expect(track).toHaveBeenCalledWith('auth_code_reused', { reason: 'restored' });
    cleanup();

    localStorage.clear();
    seedPending('golfer@example.com', 11 * 60);
    renderAuth();
    await act(async () => {});
    expect(screen.queryByTestId('sheet')).toBeNull();
  });

  it('(b) re-submitting the same email 20s after a send does not call Supabase', async () => {
    seedPending('golfer@example.com', 20);
    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('email-submit'));
    await act(async () => {});
    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(screen.getByTestId('otp-info').textContent).toBe(
      "We've already sent a code to golfer@example.com. Use that one; it can take a minute to arrive, so check spam too.",
    );
    expect(screen.getByTestId('cooldown').textContent).toBe('40');
    expect(track).toHaveBeenCalledWith('auth_code_reused', { reason: 'recent_send' });
  });

  it('(c) 429 with a pending record opens the sheet without failure tracking; without one parses the wait', async () => {
    // Record older than 60s so the submit reaches Supabase, under 10min so 429 reuses it.
    seedPending('golfer@example.com', 120);
    signInWithOtp.mockResolvedValue({ error: { status: 429, message: 'rate limited' } });
    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('email-submit'));
    await waitFor(() => expect(screen.getByTestId('sheet')).toBeTruthy());
    expect(screen.getByTestId('otp-info').textContent).toContain("We've already sent a code to golfer@example.com.");
    expect(trackAuthFailed).not.toHaveBeenCalled();
    expect(trackSignupFailed).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('auth_code_reused', { reason: 'rate_limited' });
    cleanup();

    localStorage.clear();
    signInWithOtp.mockResolvedValue({ error: { status: 429, message: 'For security purposes, you can only request this after 37 seconds' } });
    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('email-submit'));
    await waitFor(() => expect(screen.getByTestId('hero-error')).toBeTruthy());
    expect(screen.getByTestId('hero-error').textContent).toBe('Please wait 37 seconds, then try again.');
    expect(trackAuthFailed).toHaveBeenCalled();
  });

  it('(d) a successful send sets a 60-second cooldown', async () => {
    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('email-submit'));
    await waitFor(() => expect(screen.getByTestId('sheet')).toBeTruthy());
    expect(screen.getByTestId('cooldown').textContent).toBe('60');
  });

  it('(e) Google timeout shows the hero error with no toast; cancellation stays silent', async () => {
    let cb: ((r: unknown) => void) | undefined;
    (window as unknown as { median?: unknown }).median = {
      socialLogin: { google: { login: (opts: { callback: (r: unknown) => void }) => { cb = opts.callback; } } },
    };
    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('google'));
    await act(async () => {
      cb?.({ error: 'Google sign-in timed out' });
    });
    expect(screen.getByTestId('hero-error').textContent).toBe(
      'Google sign-in timed out. Try again, or use Apple or email.',
    );
    expect(toastError).not.toHaveBeenCalled();
    cleanup();

    renderAuth();
    await act(async () => {});
    fireEvent.click(screen.getByTestId('google'));
    await act(async () => {
      cb?.({ error: 'canceled' });
    });
    expect(screen.queryByTestId('hero-error')).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('(f) a successful verify clears the pending record', async () => {
    seedPending('golfer@example.com', 20);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('sheet')).toBeTruthy());
    fireEvent.click(screen.getByTestId('verify'));
    await act(async () => {});
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });
});
