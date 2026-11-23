/** BRIEF_9A explicitly requests computed sheet-heading metrics. jsdom does not
 * resolve CSS custom properties, so substitute the actual :root declarations
 * before stylesheet injection; Chromium captures verify native resolution. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';

vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({
  usePickFit: () => ({ data: [], isError: false }),
  useEventWinningScores: () => ({ data: [], isError: false }),
  useOurPickRecord: () => ({ data: null, isError: false }),
}));
vi.mock('@/features/tourhub/hooks/useTournamentPick', () => ({ usePickField: () => ({ data: [] }) }));
import { PicksSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet';
import { OurRecordSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet';
import { FieldSection } from '@/features/tourhub/tournament-v2/sections/TournamentV3Sections';

const language = createInstance();
void language.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false, interpolation: { escapeValue: false } });
const vars = new Map([...readFileSync('src/index.css', 'utf8').matchAll(/(--section-[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const resolve = (css: string) => css.replace(/var\((--section-[\w-]+)\)/g, (_match, key: string) => {
  const value = vars.get(key);
  if (value == null) throw new Error(`Missing canonical CSS variable ${key}`);
  return value;
});
let client: QueryClient;
let styles: HTMLStyleElement;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  styles = document.createElement('style');
  styles.textContent = resolve(readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css', 'utf8') + '\n' + readFileSync('src/features/tourhub/tournament-v2/tournamentPage.css', 'utf8'));
  document.head.appendChild(styles);
});
afterEach(() => { cleanup(); client.clear(); styles.remove(); });
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter></QueryClientProvider>);
const requireElement = (selector: string) => {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing sheet element ${selector}`);
  return el;
};
function expectTitle(el: HTMLElement) {
  const style = getComputedStyle(el);
  expect(style.fontSize).toBe('21px');
  expect(style.fontWeight).toBe('700');
  expect(style.letterSpacing).toBe('-0.035em');
  expect(style.lineHeight).toBe('1.05');
  expect(style.fontSynthesis).toBe('none');
}
const picks = () => mount(<PicksSheet open onClose={() => {}} picks={[]} predictions={null} eventName="Event title" venueName={null} tournamentId="fixture" />);

describe('Tour hub sheet heading canon', () => {
  it('PicksSheet title computes to 21/700/-.035em/1.05 with the five-pixel eyebrow gap', () => {
    picks();
    const title = requireElement('#overview-picks-sheet-title');
    expectTitle(title);
    expect(getComputedStyle(title).marginTop).toBe('5px');
  });
  it('pick-panel eyebrow computes to 11/700/.16em/1 and uppercase', () => {
    picks();
    const style = getComputedStyle(requireElement('.pick-panel-kicker'));
    expect(style.fontSize).toBe('11px');
    expect(style.fontWeight).toBe('700');
    expect(style.letterSpacing).toBe('0.16em');
    expect(style.lineHeight).toBe('1');
    expect(style.textTransform).toBe('uppercase');
  });
  it('Full field title computes to 21/700/-.035em/1.05 while the page kicker stays separate', () => {
    const { container } = mount(<FieldSection tour="pga" field={[{ player_id: 'p', full_name: 'Player', country: null, world_rank: null, photo_url: null, headshot_override: null }]} />);
    const open = container.querySelector<HTMLButtonElement>('[data-tv-section="field"] > button');
    if (!open) throw new Error('Missing full-field opener');
    fireEvent.click(open);
    expectTitle(requireElement('#tv-field-title'));
    const page = container.querySelector<HTMLElement>('.tv-head h2');
    if (!page) throw new Error('Missing page field kicker');
    expect(getComputedStyle(page).fontSize).toBe('11px');
  });
  it('Full field sheet titles the sorted count under a THE FIELD eyebrow at 11px / 0.16em', () => {
    const player = (id: string, rank: number) => ({ player_id: id, full_name: `Player ${id}`, country: null, world_rank: rank, photo_url: null, headshot_override: null });
    const { container } = mount(<FieldSection tour="pga" field={[player('c', 30), player('a', 3), player('b', 12)]} />);
    const open = container.querySelector<HTMLButtonElement>('[data-tv-section="field"] > button');
    if (!open) throw new Error('Missing full-field opener');
    fireEvent.click(open);
    const title = requireElement('#tv-field-title');
    expect(title.textContent).toBe('Three players, by world ranking');
    const eyebrow = title.previousElementSibling as HTMLElement | null;
    if (!eyebrow) throw new Error('Missing full-field eyebrow');
    expect(eyebrow.textContent).toBe('THE FIELD');
    const style = getComputedStyle(eyebrow);
    expect(style.fontSize).toBe('11px');
    expect(style.letterSpacing).toBe('0.16em');
    expect(getComputedStyle(title).marginTop).toBe('5px');
  });
  it('OurRecordSheet shares the canonical title and five-pixel eyebrow gap', () => {
    mount(<OurRecordSheet open onClose={() => {}} tour="pga" year={2026} />);
    const title = requireElement('#pick-record-title');
    expectTitle(title);
    expect(getComputedStyle(title).marginTop).toBe('5px');
  });
});
