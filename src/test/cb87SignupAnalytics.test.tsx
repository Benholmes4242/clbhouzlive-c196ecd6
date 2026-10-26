import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const f = vi.hoisted(() => ({ otp: vi.fn(), verify: vi.fn(), idToken: vi.fn(), from: vi.fn(), signup: vi.fn(), login: vi.fn(), complete: vi.fn(), route: vi.fn(), apple: vi.fn(), google: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInWithOtp: f.otp, verifyOtp: f.verify, signInWithIdToken: f.idToken }, from: f.from } }));
vi.mock('@/lib/auth/postAuthRoute', () => ({ resolvePostAuthRoute: f.route }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/authAnalytics', () => ({ trackAuthMethodSelected: vi.fn(), trackAuthInitiated: vi.fn(), trackAuthFailed: vi.fn(), trackAuthException: vi.fn(), trackLoginSuccess: f.login, trackSignupInitiated: vi.fn(), trackSignupSuccess: f.signup, trackSignupFailed: vi.fn(), trackAuthComplete: f.complete }));
vi.mock('@/pages/auth/components/AuthHeroScreen', () => ({ default: ({ onSubmitEmail, onAppleSignIn, onGoogleSignIn }: { onSubmitEmail: (email: string) => void; onAppleSignIn: () => void; onGoogleSignIn: () => void }) => <><button onClick={() => onSubmitEmail('member@example.test')}>Email</button><button onClick={onAppleSignIn}>Apple</button><button onClick={onGoogleSignIn}>Google</button></> }));
vi.mock('@/pages/auth/components/AuthBottomSheet', () => ({ default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => isOpen ? <section>{children}</section> : null }));
vi.mock('@/pages/auth/components/OtpSheetContent', () => ({ default: ({ onVerify }: { onVerify: (token: string) => void }) => <button onClick={() => onVerify('123456')}>Verify</button> }));
import AuthForm from '@/pages/auth/AuthForm';

beforeEach(() => {
  vi.clearAllMocks(); f.otp.mockResolvedValue({ error: null }); f.route.mockResolvedValue('/done');
  // Native bridge stand-ins invoke the actual AuthForm callbacks; no native configuration changes.
  f.apple.mockImplementation(({ callback }: { callback: (response: { idToken: string }) => void }) => callback({ idToken: 'fixture-token' }));
  f.google.mockImplementation(({ callback }: { callback: (response: { idToken: string }) => void }) => callback({ idToken: 'fixture-token' }));
  vi.stubGlobal('median', { socialLogin: { apple: { login: f.apple }, google: { login: f.google } } });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('CB87 AuthForm signup analytics', () => {
  for (const method of ['email', 'apple', 'google'] as const) {
    it.each([true, false])(`${method}: new signup=%s retains login and navigation without a follow write`, async isNew => {
      const user = { id: 'member', last_sign_in_at: '2026-10-26T09:00:00.000Z', created_at: isNew ? method === 'email' ? '2026-10-26T08:50:00Z' : '2026-10-26T08:59:59.700Z' : '2026-01-01T00:00:00Z', email_confirmed_at: method === 'email' && isNew ? '2026-10-26T09:00:00Z' : '2026-01-01T00:01:00Z', user_metadata: {} };
      const result = { data: { user, session: { user } }, error: null };
      f.verify.mockResolvedValue(result); f.idToken.mockResolvedValue(result);
      render(<MemoryRouter initialEntries={['/auth']}><Routes><Route path="/auth" element={<AuthForm />} /><Route path="/done" element={<div data-testid="finished" />} /></Routes></MemoryRouter>);
      if (method === 'email') { fireEvent.click(screen.getByRole('button', { name: 'Email' })); fireEvent.click(await screen.findByRole('button', { name: 'Verify' })); }
      else fireEvent.click(screen.getByRole('button', { name: method === 'apple' ? 'Apple' : 'Google' }));
      await screen.findByTestId('finished');
      expect(f.signup).toHaveBeenCalledTimes(isNew ? 1 : 0);
      if (isNew) expect(f.signup.mock.calls[0][0]).toBe(method);
      expect(f.login.mock.calls[0][0]).toBe(method); expect(f.complete).toHaveBeenCalledWith(method);
      expect(f.route).toHaveBeenCalledWith('member', null); expect(f.from).not.toHaveBeenCalled();
      if (method === 'email') expect(f.verify).toHaveBeenCalledWith({ email: 'member@example.test', token: '123456', type: 'email' });
      else expect(f.idToken).toHaveBeenCalledWith({ provider: method, token: 'fixture-token' });
      await waitFor(() => expect(f.complete).toHaveBeenCalledTimes(1));
    });
  }
  it('no application source imports or calls the removed automatic-follow helper', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
    const offenders = files('src').filter(path => /\.[cm]?[jt]sx?$/.test(path) && !path.includes('.test.') && !path.startsWith('src/test/')).filter(path => /followClbhouz/.test(readFileSync(path, 'utf8')));
    expect(offenders).toEqual([]); expect(existsSync('src/lib/auth/followClbhouz.ts')).toBe(false);
  });
});