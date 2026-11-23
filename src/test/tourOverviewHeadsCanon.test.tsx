/* Brief 15: Tour hub overview heads — canonical eyebrow + 21px title, and each section's title rule. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import en from '../../src/locales/en/tourhub.json';
import { OverviewSectionHead } from '@/features/tourhub/overview/sections/OverviewSectionHead';
import { alsoWeekTitle, comingUpTitle, newsTitle, rankingsTail, rankingsTitle } from '@/features/tourhub/overview/sections/overviewHeadTitles';
import { leadSentence } from '@/features/tourhub/overview/sections/worldRankingsRules';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { tourhub: en } } });
const t = i18n.getFixedT('en', 'tourhub') as unknown as (k: string, o?: Record<string, unknown>) => string;
afterEach(cleanup);

describe('OverviewSectionHead metrics', () => {
  it('eyebrow 11px / 0.16em; title 21 / 700 / -0.035em / 1.05', () => {
    render(<OverviewSectionHead eyebrow="E" title="T" />);
    const eb = document.querySelector<HTMLElement>('[data-overview-eyebrow]')!;
    expect(eb.style.fontSize).toBe('11px');
    expect(eb.style.letterSpacing).toBe('0.16em');
    const title = document.querySelector<HTMLElement>('[data-overview-title]')!;
    expect([title.style.fontSize, title.style.fontWeight, title.style.letterSpacing, title.style.lineHeight]).toEqual(['21px', '700', '-0.035em', '1.05']);
  });
  it('action present with onAction, absent without; live dot only when live', () => {
    const a = render(<OverviewSectionHead eyebrow="E" title="T" action="A" onAction={() => {}} live />);
    expect(document.querySelector('[data-overview-action]')).not.toBeNull();
    expect(document.querySelector('[data-overview-live-dot]')).not.toBeNull();
    a.unmount();
    render(<OverviewSectionHead eyebrow="E" title="T" action="A" />);
    expect(document.querySelector('[data-overview-action]')).toBeNull();
    expect(document.querySelector('[data-overview-live-dot]')).toBeNull();
  });
});

describe('Also this week title', () => {
  const ev = (name: string, live: boolean) => ({ name, live });
  it('two events, one live', () => expect(alsoWeekTitle(t, [ev('A', true), ev('B', false)], null)).toBe('Two more events, one live'));
  it('two events, none live', () => expect(alsoWeekTitle(t, [ev('A', false), ev('B', false)], null)).toBe('Two more events this week'));
  it('one live event', () => expect(alsoWeekTitle(t, [ev('Australian Open', true)], 3)).toBe('Australian Open, round three'));
  it('one event not live', () => expect(alsoWeekTitle(t, [ev('Hero World Challenge', false)], null)).toBe('Hero World Challenge'));
});

describe('Coming up countdown', () => {
  const now = new Date(2026, 10, 23, 15, 0);
  it.each([
    ['2026-11-23', 'Next event starts today'],
    ['2026-11-24', 'Next event starts tomorrow'],
    ['2026-11-27', 'Next event in four days'],
    ['2026-12-05', 'Next event in 12 days'],
    ['2026-12-16', 'Next event in three weeks'],
  ])('%s', (start, expected) => expect(comingUpTitle(t, start, now)).toBe(expected));
});

describe('World rankings title and tail', () => {
  const row = (playerName: string, points: number) => ({ playerName, points });
  it('leads title and tail-only line', () => {
    const s = leadSentence([row('Scottie Scheffler', 1900), row('Rory McIlroy', 900)], 2);
    expect(rankingsTitle(t, s, 'World')).toBe('Scheffler leads by 1,000 points');
    expect(rankingsTail(t, s)).toBe("More than twice anyone else's total, with 2 events left.");
  });
  it('level title has no tail', () => {
    const s = leadSentence([row('Scottie Scheffler', 1891), row('Rory McIlroy', 1891)], null);
    expect(rankingsTitle(t, s, 'World')).toBe('Scheffler and McIlroy are level on 1,891 points');
    expect(rankingsTail(t, s)).toBeNull();
  });
  it('plain lead without events left has no tail; null lead falls back to the board name', () => {
    const s = leadSentence([row('Scottie Scheffler', 10), row('Rory McIlroy', 9)], null);
    expect(rankingsTail(t, s)).toBeNull();
    expect(rankingsTitle(t, null, 'Race to Dubai')).toBe('Race to Dubai');
  });
});

describe('News title', () => {
  it.each([[0, 'The latest from the tours'], [1, 'One new since your last visit'], [3, 'Three new since your last visit']])('%i', (n, expected) => expect(newsTitle(t, n as number)).toBe(expected));
});
