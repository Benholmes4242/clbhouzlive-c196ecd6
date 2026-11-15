import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import auth from '../../public/locales/en/auth.json';

const state = vi.hoisted(() => ({ native: true, enabled: true, user: null as null | { is_anonymous: boolean }, loading: false }));
vi.mock('@/utils/median/isMedianApp', () => ({ isMedianApp: () => state.native }));
vi.mock('@/features/guest/guestConfig', () => ({ get GUEST_BROWSING_ENABLED() { return state.enabled; } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: state.user, loading: state.loading }) }));
vi.mock('@/lib/toast', () => ({ toast: { info: vi.fn() } }));

import AuthHeroScreen from '@/pages/auth/components/AuthHeroScreen';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { auth, common: { back: 'Back' } } }, interpolation: { escapeValue: false }, initAsync: false });
const submit = vi.fn();
const apple = vi.fn();
const google = vi.fn();
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function mount(props: Partial<React.ComponentProps<typeof AuthHeroScreen>> = {}, from?: string | { pathname: string; search?: string }) {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={[{ pathname: '/auth', state: from ? { from } : null }]}>
    <AuthHeroScreen submittingMethod={null} onSubmitEmail={submit} onAppleSignIn={apple} onGoogleSignIn={google} {...props} /><Location />
  </MemoryRouter></I18nextProvider>);
}
function openEmail() { fireEvent.click(screen.getByRole('button', { name: 'Continue with email' })); return screen.getByRole('textbox', { name: 'Email address' }); }
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); Object.assign(state, { native: true, enabled: true, user: null, loading: false }); });
afterEach(cleanup);

describe('signed-off sign-in interaction rules', () => {
  it('offers native social actions without an initial email field', () => {
    mount();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(apple).toHaveBeenCalledTimes(1); expect(google).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/privacy');
  });
  it('focuses email when entering the email step', () => { mount(); expect(openEmail()).toBe(document.activeElement); });
  it('keeps typed email when returning through choose', () => {
    mount(); fireEvent.change(openEmail(), { target: { value: 'golfer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect((openEmail() as HTMLInputElement).value).toBe('golfer@example.com');
  });
  it('enables submission only for a valid trimmed email', () => {
    mount(); const input = openEmail(); const send = screen.getByRole('button', { name: 'Send code' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(input, { target: { value: 'not-an-email' } }); expect(send.disabled).toBe(true);
    fireEvent.click(send); expect(submit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' golfer@example.com ' } }); expect(send.disabled).toBe(false);
    fireEvent.click(send); expect(submit).toHaveBeenCalledWith('golfer@example.com');
  });
  it('preserves Enter submission and validation', () => {
    mount(); const input = openEmail(); fireEvent.keyDown(input, { key: 'Enter' }); expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.change(input, { target: { value: 'golfer@example.com' } }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(submit).toHaveBeenCalledWith('golfer@example.com');
  });
  it('shows server errors in email then clears them after editing', () => {
    mount({ errorMessage: 'Service unavailable', errorNonce: 1 }); const input = openEmail();
    expect(screen.getByRole('alert').textContent).toBe('Service unavailable');
    fireEvent.change(input, { target: { value: 'g' } }); expect(screen.queryByRole('alert')).toBeNull();
  });
  it('returns browsing to the prior location', () => {
    mount({}, { pathname: '/courses', search: '?region=gb' });
    fireEvent.click(screen.getByRole('button', { name: 'Look around first' }));
    expect(screen.getByTestId('location').textContent).toBe('/courses?region=gb');
  });
  it('returns browsing to root without a prior location', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Look around first' })); expect(screen.getByTestId('location').textContent).toBe('/');
  });
  it('suppresses browsing when the switch is off', () => { state.enabled = false; mount(); expect(screen.queryByRole('button', { name: 'Look around first' })).toBeNull(); });
  it('suppresses browsing for a signed-in member', () => { state.user = { is_anonymous: false }; mount(); expect(screen.queryByRole('button', { name: 'Look around first' })).toBeNull(); });
  it('allows browsing for a canonical anonymous guest but not unresolved sessions', () => {
    state.user = { is_anonymous: true }; mount(); expect(screen.getByRole('button', { name: 'Look around first' })).toBeTruthy(); cleanup();
    state.loading = true; mount(); expect(screen.queryByRole('button', { name: 'Look around first' })).toBeNull();
  });
  it('does not offer native social actions on web', () => {
    state.native = false; mount(); expect(screen.queryByRole('button', { name: 'Continue with Apple' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull(); expect(screen.getByRole('button', { name: 'Continue with email' })).toBeTruthy();
  });
  it('disables every choose action while a method submits', () => {
    mount({ submittingMethod: 'apple' }); for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});