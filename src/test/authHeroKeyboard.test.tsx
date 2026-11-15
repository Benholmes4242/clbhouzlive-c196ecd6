import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import auth from '../../public/locales/en/auth.json';

vi.mock('@/utils/median/isMedianApp', () => ({ isMedianApp: () => false }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/lib/toast', () => ({ toast: { info: vi.fn() } }));

import AuthHeroScreen from '@/pages/auth/components/AuthHeroScreen';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { auth, common: { back: 'Back' } } }, interpolation: { escapeValue: false }, initAsync: false });
const css = readFileSync('src/pages/auth/components/auth-hero.css', 'utf8');
const indexCss = readFileSync('src/index.css', 'utf8');

class FakeViewport extends EventTarget { height = 490; offsetTop = 0; }
let vv: FakeViewport;
function mount() {
  const view = render(<I18nextProvider i18n={i18n}><MemoryRouter><AuthHeroScreen submittingMethod={null} onSubmitEmail={vi.fn()} /></MemoryRouter></I18nextProvider>);
  const root = view.container.querySelector('.auth-hero-screen') as HTMLElement;
  fireEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
  return { root, input: screen.getByRole('textbox', { name: 'Email address' }) };
}
beforeEach(() => { vv = new FakeViewport(); Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv }); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('sign-in glow and keyboard', () => {
  it('renders no glow and keeps no glow rule or token', () => {
    const { root } = mount();
    expect(root.querySelector('.auth-hero-glow')).toBeNull();
    expect(css).not.toContain('auth-hero-glow');
    expect(indexCss).not.toContain('--auth-glow');
  });
  it('locks tagline values while inheriting the app font', () => {
    const rule = css.match(/\.auth-hero-brand h1 \{([^}]*)\}/)?.[1] ?? '';
    for (const value of ['font-size: 34px', 'font-weight: 800', 'letter-spacing: -.035em', 'line-height: 1.05', '-webkit-font-smoothing: antialiased', '-moz-osx-font-smoothing: grayscale']) expect(rule).toContain(value);
    expect(rule).not.toContain('font-family');
  });
  it('pins focused input mode to the visual viewport', () => {
    const { root, input } = mount();
    expect(root.classList.contains('is-keyboard-open')).toBe(true);
    expect(root.style.height).toBe('490px');
    act(() => { vv.offsetTop = 120; vv.dispatchEvent(new Event('scroll')); });
    expect(root.style.top).toBe('120px');
    expect(input).toBe(document.activeElement);
  });
  it('clears keyboard mode and resets the moved window on blur', () => {
    vi.useFakeTimers();
    const { root, input } = mount();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 80 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    act(() => { input.blur(); vi.advanceTimersByTime(120); });
    expect(root.classList.contains('is-keyboard-open')).toBe(false);
    expect([root.style.top, root.style.height, root.style.bottom]).toEqual(['', '', '']);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
  it('marks short keyboard space as tight', () => {
    vv.height = 380;
    const { root } = mount();
    expect(root.classList.contains('is-keyboard-tight')).toBe(true);
  });
});
