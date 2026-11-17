/**
 * SIGN-IN CODE STEP — the "Check your email" step renders as a panel state of
 * the sign-in screen (no sheet), with the back arrow, the sentence carrying
 * the address and Change, six boxes, and a white sentence-case Verify pill
 * that stays dark until all six digits are in.
 * Real AuthForm + real AuthHeroScreen + real OtpSheetContent with a real i18n
 * provider (the sign-in suite pattern); assertions are structural.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import auth from '../../src/locales/en/auth.json';

const signInWithOtp = vi.fn<(...a: unknown[]) => unknown>();
const verifyOtp = vi.fn<(...a: unknown[]) => unknown>();
const getSession = vi.fn<(...a: unknown[]) => unknown>();
const onAuthStateChange = vi.fn<(...a: unknown[]) => unknown>(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: (...a: unknown[]) => signInWithOtp(...a),
      verifyOtp: (...a: unknown[]) => verifyOtp(...a),
      updateUser: vi.fn(),
      getSession: (...a: unknown[]) => getSession(...a),
      onAuthStateChange: (...a: unknown[]) => onAuthStateChange(...a),
    },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })),
  },
}));

vi.mock('@/lib/authAnalytics', () => ({
  trackAuthMethodSelected: vi.fn(),
  trackAuthInitiated: vi.fn(),
  trackAuthFailed: vi.fn(),
  trackAuthException: vi.fn(),
  trackSignupInitiated: vi.fn(),
  trackSignupFailed: vi.fn(),
  trackSignupSuccess: vi.fn(),
  trackLoginSuccess: vi.fn(),
  trackAuthComplete: vi.fn(),
  buildAuthErrorExtras: vi.fn(() => ({})),
}));

vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: vi.fn(async () => '/') }));

vi.mock('@/utils/analyticsEvents', () => ({
  analyticsEvents: { track: vi.fn() },
}));

vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/utils/median/isMedianApp', () => ({ isMedianApp: () => false }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));

import AuthForm from '@/pages/auth/AuthForm';
import OtpSheetContent from '@/pages/auth/components/OtpSheetContent';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { auth, common: { back: 'Back' } } }, interpolation: { escapeValue: false }, initAsync: false });

const EMAIL = 'golfer@example.com';

const renderAuth = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    </I18nextProvider>,
  );

/** Drive choose → email → send, landing on the code step. */
const reachCodeStep = async () => {
  fireEvent.click(document.querySelector<HTMLButtonElement>('.auth-hero-pill')!);
  const input = document.querySelector<HTMLInputElement>('.auth-hero-input')!;
  fireEvent.change(input, { target: { value: EMAIL } });
  fireEvent.click(document.querySelector<HTMLButtonElement>('.auth-hero-send')!);
  await waitFor(() => expect(document.querySelectorAll('.auth-hero-otp-box').length).toBe(6));
};

const typeDigits = (digits: string) => {
  const boxes = document.querySelectorAll<HTMLInputElement>('.auth-hero-otp-box');
  digits.split('').forEach((d, i) => {
    fireEvent.change(boxes[i], { target: { value: d } });
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: null } });
  signInWithOtp.mockResolvedValue({ error: null });
  verifyOtp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
  (window as unknown as { median?: unknown }).median = undefined;
});

afterEach(() => cleanup());

describe('Sign-in code step', () => {
  it('(a) renders inside .auth-hero-screen with no sheet or dialog', async () => {
    renderAuth();
    await reachCodeStep();

    const screenEl = document.querySelector('.auth-hero-screen')!;
    expect(screenEl).toBeTruthy();
    // No bottom sheet, no dialog.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    // The "Look around first" band never shows on the code step.
    expect(document.querySelector('.auth-hero-band')).toBeNull();
    // Back arrow, heading, sentence with the address and Change, six boxes, Verify.
    expect(screenEl.querySelector('.auth-hero-back')).toBeTruthy();
    expect(screenEl.querySelector('.auth-hero-panel h2')).toBeTruthy();
    const hint = screenEl.querySelector('.auth-hero-hint')!;
    expect(hint.textContent).toContain(EMAIL);
    expect(hint.querySelector('.auth-hero-otp-change')).toBeTruthy();
    expect(screenEl.querySelectorAll('.auth-hero-otp-box').length).toBe(6);
    expect(screenEl.querySelector('.auth-hero-pill.auth-hero-send')).toBeTruthy();
    // The panel uses the bottom padding variant, like the email step.
    expect(screenEl.querySelector('.auth-hero-panel')!.className).toContain('auth-hero-panel-bottom');
  });

  it('(b) Verify is disabled with five digits, enabled with six, and auto-submit verifies', async () => {
    // Enabled-with-six is asserted on OtpSheetContent directly: in the full
    // flow the sixth digit auto-submits, so the pill is already showing the
    // submitting spinner by the time it can be inspected.
    const onVerify = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <OtpSheetContent
          email={EMAIL}
          submitting={false}
          errorMessage={null}
          resendCooldown={0}
          onVerify={onVerify}
          onResend={vi.fn()}
          onUseDifferentEmail={vi.fn()}
        />
      </I18nextProvider>,
    );

    const verify = document.querySelector<HTMLButtonElement>('.auth-hero-pill.auth-hero-send')!;
    typeDigits('12345');
    expect(verify.disabled).toBe(true);
    expect(onVerify).not.toHaveBeenCalled();

    typeDigits('123456');
    expect(verify.disabled).toBe(false);
    expect(onVerify).toHaveBeenCalledWith('123456');
    cleanup();

    // End to end: the sixth digit auto-submits through AuthForm.
    renderAuth();
    await reachCodeStep();
    typeDigits('123456');
    await waitFor(() =>
      expect(verifyOtp).toHaveBeenCalledWith({
        email: EMAIL,
        token: '123456',
        type: 'email',
      }),
    );
  });

  it('(c) Back and Change both return to the email step with the address still in the box', async () => {
    renderAuth();
    await reachCodeStep();

    fireEvent.click(document.querySelector<HTMLButtonElement>('.auth-hero-otp-change')!);
    let input = document.querySelector<HTMLInputElement>('.auth-hero-input');
    expect(input).toBeTruthy();
    expect(input!.value).toBe(EMAIL);
    expect(document.querySelectorAll('.auth-hero-otp-box').length).toBe(0);

    // Forward again, then the back arrow does the same.
    fireEvent.click(document.querySelector<HTMLButtonElement>('.auth-hero-send')!);
    await waitFor(() => expect(document.querySelectorAll('.auth-hero-otp-box').length).toBe(6));
    fireEvent.click(document.querySelector<HTMLButtonElement>('.auth-hero-back')!);
    input = document.querySelector<HTMLInputElement>('.auth-hero-input');
    expect(input).toBeTruthy();
    expect(input!.value).toBe(EMAIL);
  });

  it('(d) the sentence and Verify carry no uppercase styling', async () => {
    renderAuth();
    await reachCodeStep();

    const hint = document.querySelector('.auth-hero-hint')!;
    expect(hint.className).not.toContain('uppercase');
    expect((hint as HTMLElement).style.textTransform).toBe('');

    const verify = document.querySelector<HTMLButtonElement>('.auth-hero-pill.auth-hero-send')!;
    expect(verify.className).not.toContain('uppercase');
    expect(verify.style.textTransform).toBe('');
    expect(verify.style.letterSpacing).toBe('');
  });

  it('(e) focusing a box adds is-keyboard-open, and moving box to box keeps it', async () => {
    renderAuth();
    await reachCodeStep();

    const screenEl = document.querySelector('.auth-hero-screen')!;
    // The first box is auto-focused on mount, which turns keyboard mode on.
    await waitFor(() => expect(screenEl.className).toContain('is-keyboard-open'));
    // Moving focus from box to box must not drop keyboard mode (the 100ms
    // re-check covers the gap between focusout and focusin).
    const boxes = document.querySelectorAll<HTMLInputElement>('.auth-hero-otp-box');
    await act(async () => {
      fireEvent.focus(boxes[3]);
    });
    expect(screenEl.className).toContain('is-keyboard-open');
  });
});
