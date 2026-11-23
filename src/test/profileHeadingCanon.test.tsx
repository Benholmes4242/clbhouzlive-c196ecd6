/** BRIEF 10 — Profile, Settings, social and messaging headings to canon.
 * jsdom does not resolve CSS custom properties, so the --section-* values are
 * substituted from src/index.css before each stylesheet is injected (the same
 * method as tourSheetHeadingCanon); Chromium captures verify native resolution. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { TITLE as ROUNDS_TITLE } from '@/components/profile/rounds/sections/roundsTokens';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { SheetHeader } from '@/components/ui/SheetHeader';

const vars = new Map([...readFileSync('src/index.css', 'utf8').matchAll(/(--section-[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const resolve = (css: string) => css.replace(/var\((--section-[\w-]+)\)/g, (_m, key: string) => {
  const value = vars.get(key);
  if (value == null) throw new Error(`Missing canonical CSS variable ${key}`);
  return value;
});
let sheets: HTMLStyleElement[] = [];
const inject = (path: string) => { const s = document.createElement('style'); s.textContent = resolve(readFileSync(path, 'utf8')); document.head.appendChild(s); sheets.push(s); };
afterEach(() => { cleanup(); sheets.forEach(s => s.remove()); sheets = []; });

function expectCanon(el: HTMLElement | null) {
  if (!el) throw new Error('Missing heading');
  const style = getComputedStyle(el);
  expect(style.fontSize).toBe('21px');
  expect(style.fontWeight).toBe('700');
  expect(style.letterSpacing).toBe('-0.035em');
  expect(style.lineHeight).toBe('1.05');
}

describe('Profile, Settings, social and messaging heading canon', () => {
  it('a Rounds section title uses the section canon with the five-pixel gap', () => {
    const { container } = render(<h3 style={ROUNDS_TITLE}>Title</h3>);
    const el = container.querySelector('h3') as HTMLElement;
    expectCanon(el);
    expect(el.style.marginTop).toBe('5px');
  });

  it('a BizcSheet title computes to the section canon', () => {
    inject('src/features/business-create/business-create.css');
    render(<BizcSheet title="Your name" onDone={() => {}} testId="canon-bizc">x</BizcSheet>);
    expectCanon(document.querySelector<HTMLElement>('[data-testid="canon-bizc"] .bizc-sheet-title'));
  });

  it('the pro profile sheet title computes to the section canon', () => {
    inject('src/features/pro-profile/pro-profile.css');
    const { container } = render(<div className="pro-profile pro-profile-sheet"><div className="pro-collection-kicker">IN THE BAG</div><h2>Your clubs</h2></div>);
    expectCanon(container.querySelector('h2'));
  });

  it('a messaging sheet title (SheetHeader, as New message renders it) computes to the section canon', () => {
    render(<SheetHeader title="New message" onClose={() => {}} dark />);
    const heading = document.querySelector<HTMLElement>('h2, h3, [role="heading"]') ?? Array.from(document.querySelectorAll<HTMLElement>('*')).find(n => n.textContent === 'New message' && n.children.length === 0) ?? null;
    expectCanon(heading);
  });

  it('the welcome h1 keeps 28px with tight tracking and 1.05 leading', () => {
    inject('src/styles/welcome.css');
    const { container } = render(<div className="welcome-body"><h1>Welcome</h1></div>);
    const style = getComputedStyle(container.querySelector('h1') as HTMLElement);
    expect(style.fontSize).toBe('28px');
    expect(style.letterSpacing).toBe('-0.035em');
    expect(style.lineHeight).toBe('1.05');
  });
});
