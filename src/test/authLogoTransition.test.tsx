import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import auth from '../../src/locales/en/auth.json';

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
const rule = (sel: string, src = css) => src.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{([^}]*)\\}'))?.[1] ?? '';
const EASE = '240ms cubic-bezier(.2,.8,.2,1)';

describe('FIX_AUTH_LOGO_TRANSITION', () => {
  it('keyboard open collapses the logo to transparent, scaled, zero height and keeps it in the DOM', () => {
    const { root } = mount();
    expect(root.classList.contains('is-keyboard-open')).toBe(true);
    expect(root.querySelector('.auth-hero-brand img')).not.toBeNull();
    const open = rule('.auth-hero-screen.is-keyboard-open .auth-hero-brand img');
    for (const v of ['opacity: 0', 'transform: scale(.88)', 'height: 0']) expect(open).toContain(v);
    expect(open).not.toContain('display');
    expect(css).not.toMatch(/is-keyboard-open \.auth-hero-brand img \{[^}]*display: none/);
  });
  it('without keyboard mode the logo returns to full size and the tagline gap', () => {
    vi.useFakeTimers();
    const { root, input } = mount();
    act(() => { input.blur(); vi.advanceTimersByTime(120); });
    expect(root.classList.contains('is-keyboard-open')).toBe(false);
    const base = rule('.auth-hero-brand img');
    for (const v of ['height: 68px', 'opacity: 1', 'transform: scale(1)']) expect(base).toContain(v);
    expect(css).toMatch(/@media \(max-height: 640px\) \{\s*\.auth-hero-brand img \{ width: 52px; height: 52px; \}/);
  });
  it('opacity, transform, height and the tagline margin-top share one 240ms easing', () => {
    const base = rule('.auth-hero-brand img');
    for (const p of ['opacity', 'transform', 'height']) expect(base).toContain(`${p} ${EASE}`);
    expect(rule('.auth-hero-brand h1')).toContain(`margin-top ${EASE}`);
  });
  it('the bounce entrance runs once and is removed after it ends', () => {
    mount();
    const img = document.querySelector('.auth-hero-brand img') as HTMLElement;
    expect(img.classList.contains('auth-logo-animate')).toBe(true);
    fireEvent.animationEnd(img);
    expect(img.classList.contains('auth-logo-animate')).toBe(false);
  });
  it('reduced motion has no transition', () => {
    const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(rm).toContain('.auth-hero-brand img, .auth-hero-brand h1 { transition: none; }');
  });
});
