/* Brief 16 close-out: World rankings pair-level title — measure, then fall back. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../src/locales/en/tourhub.json';
import { levelHeadForm, leadSentence } from '@/features/tourhub/overview/sections/worldRankingsRules';

const lines = vi.hoisted(() => ({ n: 1 }));
vi.mock('@/features/tourhub/overview/sections/measureTitleLines', () => ({ measureTitleLines: () => lines.n }));
import { RankingsLead } from '@/features/tourhub/overview/sections/RankingsLead';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { tourhub: en } } });
afterEach(cleanup);

const pair = (a: string, b: string, eventsLeft: number | null = null) =>
  leadSentence([{ playerName: `X ${a}`, points: 1891 }, { playerName: `Y ${b}`, points: 1891 }, { playerName: 'Z Z', points: 10 }], eventsLeft);
const draw = (s: ReturnType<typeof pair>) => render(
  <I18nextProvider i18n={i18n}><RankingsLead sentence={s} boardName="World" eyebrow="E" action="A" onAction={() => {}} /></I18nextProvider>,
);
const title = () => document.querySelector('[data-overview-title]')!.textContent;
const tail = () => document.querySelector('[data-lead-sentence]')?.textContent;

describe('levelHeadForm', () => {
  it('1 line keeps names', () => expect(levelHeadForm(1)).toBe('names'));
  it('2 lines keeps names', () => expect(levelHeadForm(2)).toBe('names'));
  it('3 lines falls back to count', () => expect(levelHeadForm(3)).toBe('count'));
});

describe('RankingsLead pair level', () => {
  it('a 3-line measurement shows "Two level at the top" and the names line', () => {
    lines.n = 3;
    draw(pair('Christiansen', 'Featherstone', 2));
    expect(title()).toBe('Two level at the top');
    expect(tail()).toBe('Christiansen and Featherstone, both on 1,891 points. With 2 events left.');
  });
  it('"Scheffler and McIlroy level" is unchanged when it fits', () => {
    lines.n = 2;
    draw(pair('Scheffler', 'McIlroy'));
    expect(title()).toBe('Scheffler and McIlroy level');
    expect(tail()).toBe('Both on 1,891 points.');
  });
});
