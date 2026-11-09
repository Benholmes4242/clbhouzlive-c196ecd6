import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import tourhub from '../../public/locales/en/tourhub.json';

vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
const record = vi.hoisted(() => ({ value: null as null | { event_count: number; won: number; top10: number } }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({
  useOurPickRecord: () => ({ data: record.value, isError: false }),
  useBeatTheModel: () => ({ data: [] }),
  useMyPickOdds: () => ({ data: null }),
}));

import {
  RECAP_AFTER_DAYS, RECAP_NEXT_EVENT_WINDOW_DAYS, isBetweenSeasons, isFreshStandings, columnMajor, recapFactCells, ageAt,
} from '@/features/tourhub/components/overview-v3/seasonRecapRules';
import { RecapPhotoBand, SeasonRecapBody, recapSentence } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({ lng: 'en', ns: ['tourhub'], defaultNS: 'tourhub', resources: { en: { tourhub } }, interpolation: { escapeValue: false } });
const t = i18n.getFixedT('en', 'tourhub') as unknown as (k: string, o?: Record<string, unknown>) => string;

const KF_TOP20 = ['Ross Steelman', 'Sandy Scott', 'Ian Holt', 'Alistair Docherty', 'Alvaro Ortiz', 'Austin Hitt', 'Cole Sherwood', 'Doc Redman', 'Blades Brown', 'Tommy Morrison', 'Cooper Dossey', 'Hunter Eichhorn', 'Dylan Menante', 'Michael Johnson', 'Jeremy Gandon', 'Taylor Dickson', 'Ian Gilligan', 'Davis Shore', 'Carson Young', 'Davis Lamb'];
const KF_POINTS = [2221.4, 2191, 1618.2];

function kf(over: Partial<SeasonRecapData> = {}): SeasonRecapData {
  return {
    events: 25, winners: 20, maxWins: 2, mostWinsSurname: 'Steelman', tiedLeaders: 1,
    standings: KF_TOP20.map((name, i) => ({ position: i + 1, name, points: KF_POINTS[i] ?? 1000 - i, playerId: `p${i}` })),
    standingsSource: { table: 'tour_season_rankings', date: '2026-10-12T00:00:00Z' },
    cardLine: { label: 'TOP 20 · PGA TOUR CARD FOR 2027', n: 20 },
    cardEarners: KF_TOP20.map((name) => ({ name, age: name === 'Blades Brown' ? 19 : 27 })),
    ...over,
  };
}
const stale = (d: SeasonRecapData): SeasonRecapData => ({ ...d, standings: null, standingsSource: null, cardLine: null, cardEarners: [] });

const slide = (tourSlug: string): HeroSlide => ({ type: 'completed', tournament: {
  id: 't1', tourSlug, seasonYear: 2026, name: 'Korn Ferry Tour Championship', status: 'closed', startDate: '2026-10-08', endDate: '2026-10-11', venueName: 'The Federal Club',
} as unknown as HeroSlide['tournament'] });
const results = { kind: 'results', variant: 'final', finishDate: '2026-10-11', meta: '' } as never;

function wrap(node: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient()}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider></I18nextProvider>);
}

describe('between-seasons rule', () => {
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
  it('exports the constants', () => { expect(RECAP_AFTER_DAYS).toBe(7); expect(RECAP_NEXT_EVENT_WINDOW_DAYS).toBe(21); });
  it('7+ days after the last event with nothing in 21 days → recap', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2026-10-19') })).toBe(true);
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2027-01-20', raceFinal: false, now: at('2026-11-09') })).toBe(true);
  });
  it('a next event within 21 days → no recap', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2026-11-20', raceFinal: true, now: at('2026-11-09') })).toBe(false);
  });
  it('within 7 days and not final → no recap; final → recap', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2026-10-15') })).toBe(false);
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: true, now: at('2026-10-15') })).toBe(true);
  });
  it('1 January with a loaded next event → upcoming; with none → recap stays', () => {
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2027-03-01', raceFinal: false, now: at('2027-01-01') })).toBe(false);
    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2027-01-01') })).toBe(true);
  });
  it('a next season starting within 21 days of the finale never shows the recap (DP World 2027)', () => {
    // Finale ends 15 Nov 2026; the 2027 season opens 26 Nov 2026 (season year 2027).
    for (const day of ['2026-11-16', '2026-11-20', '2026-11-25']) {
      expect(isBetweenSeasons({ lastEnd: '2026-11-15', seasonYear: 2026, nextStart: '2026-11-26', raceFinal: true, now: at(day) })).toBe(false);
      expect(isBetweenSeasons({ lastEnd: '2026-11-15', seasonYear: 2026, nextStart: '2026-11-26', raceFinal: false, now: at(day) })).toBe(false);
    }
  });
  it('freshness compares the source date with the final end date', () => {
    expect(isFreshStandings('2026-09-07T05:00:00Z', '2026-10-11')).toBe(false);
    expect(isFreshStandings('2026-10-11', '2026-10-11')).toBe(true);
    expect(isFreshStandings(null, '2026-10-11')).toBe(false);
  });
  it('age in whole years at the final event end date', () => {
    expect(ageAt('2007-02-20', '2026-10-11')).toBe(19);
    expect(ageAt('2006-10-12', '2026-10-11')).toBe(19);
  });
});

describe('recap band', () => {
  it('renders kicker, title, final-event place line, points figure and Korn Ferry sentence', () => {
    const { container } = wrap(<RecapPhotoBand slide={slide('pgad')} state={results} data={kf()} onOpen={() => {}} />);
    const band = container.querySelector('[data-overview-photo-band]')!;
    expect(band.getAttribute('data-overview-photo-state')).toBe('recap');
    expect(band.textContent).toContain('KORN FERRY TOUR · 2026 SEASON');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The season in review');
    expect(band.textContent).toContain('Final event · The Federal Club · 8–11 Oct');
    const fig = container.querySelector('[data-overview-recap-figure]')!;
    expect(fig.textContent).toBe('2,221Steelman');
    expect(container.querySelector('[data-overview-photo-situation]')!.textContent).toBe('Steelman topped the points list. The top 20 earned PGA TOUR cards for 2027.');
  });
  it.each([
    ['euro', 'Steelman won the Race to Dubai.'],
    ['lpga', 'Steelman won the Race to the CME Globe. The top 20 kept full status for 2027.'],
    ['pga', 'Steelman won the FedEx Cup. The top 20 kept full cards for 2027.'],
    ['champ', 'Steelman won the Charles Schwab Cup.'],
  ])('sentence copy for %s', (tour, sentence) => {
    const data = tour === 'euro' || tour === 'champ' ? kf({ cardLine: null }) : kf();
    expect(recapSentence(tour as never, data, 2026, t).map((s) => s.text).join('')).toBe(sentence);
  });
  it('stale standings hide the figure and use the winners sentence', () => {
    const { container } = wrap(<RecapPhotoBand slide={slide('pgad')} state={results} data={stale(kf())} onOpen={() => {}} />);
    expect(container.querySelector('[data-overview-recap-figure]')).toBeNull();
    expect(container.querySelector('[data-overview-photo-situation]')!.textContent).toBe('20 different winners across 25 events.');
  });
});

describe('recap body', () => {
  it('facts row with a card line: EVENTS, WINNERS, CARDS, YOUNGEST', () => {
    const { container } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
    const cells = [...container.querySelectorAll('[data-recap-fact]')].map((c) => [c.getAttribute('data-recap-fact'), c.querySelector('b')!.textContent]);
    expect(cells).toEqual([['events', '25'], ['winners', '20'], ['cards', '20'], ['youngest', '19']]);
  });
  it('facts row without a card line: MOST WINS with surname, or players on a tie', () => {
    expect(recapFactCells({ events: 30, winners: 22, maxWins: 3, mostWinsSurname: 'Hojgaard', tiedLeaders: 1, cards: null, youngest: null, tiedLabel: (n) => `${n} players` }))
      .toEqual([{ key: 'events', value: '30' }, { key: 'winners', value: '22' }, { key: 'mostWins', value: '3', small: 'Hojgaard' }]);
    expect(recapFactCells({ events: 30, winners: 22, maxWins: 2, mostWinsSurname: null, tiedLeaders: 3, cards: null, youngest: null, tiedLabel: (n) => `${n} players` })[2])
      .toEqual({ key: 'mostWins', value: '2', small: '3 players' });
  });
  it('stale standings hide the board, card list and CARDS/YOUNGEST', () => {
    const { container } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={stale(kf())} />);
    expect(container.querySelector('[data-recap-board]')).toBeNull();
    expect(container.querySelector('[data-recap-cards]')).toBeNull();
    const keys = [...container.querySelectorAll('[data-recap-fact]')].map((c) => c.getAttribute('data-recap-fact'));
    expect(keys).toEqual(['events', 'winners', 'mostWins']);
  });
  it('board: trophy for first, rounded points, Full list link', () => {
    const { container } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
    const board = container.querySelector('[data-recap-board]')!;
    expect(board.querySelector('[data-recap-row="1"] [data-recap-trophy]')).not.toBeNull();
    expect(board.querySelector('[data-recap-row="1"]')!.textContent).not.toContain('1Ross');
    expect(board.querySelector('[data-recap-full-list]')!.textContent).toBe('Full list ›');
    expect(board.textContent).toContain('POINTS LIST · FINAL');
  });
  it('Korn Ferry fixture renders exactly the mock names and points', () => {
    const { container } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
    const rows = [...container.querySelectorAll('[data-recap-row]')].map((r) => [r.querySelector('.recap-name')!.textContent, r.querySelector('.recap-pts')!.textContent]);
    expect(rows).toEqual([['Ross Steelman', '2,221'], ['Sandy Scott', '2,191'], ['Ian Holt', '1,618']]);
    const cards = [...container.querySelectorAll('[data-recap-card]')].map((c) => c.querySelector('b')!.textContent);
    expect(cards).toEqual(columnMajor(KF_TOP20));
    expect(cards[0]).toBe('Ross Steelman'); expect(cards[1]).toBe('Cooper Dossey'); expect(cards[19]).toBe('Davis Lamb');
    expect(container.querySelector('[data-recap-cards] h2')!.textContent).toBe('TOP 20 · PGA TOUR CARD FOR 2027');
    expect(container.querySelector('[data-recap-youngest]')!.textContent).toBe('Blades Brown earned his card at 19, the youngest of the 20.');
  });
  it('ruling 1: CARDS shows above 20 with MOST WINS as the 4th cell', () => {
    expect(recapFactCells({ events: 32, winners: 24, maxWins: 4, mostWinsSurname: 'Korda', tiedLeaders: 1, cards: 80, youngest: 19, tiedLabel: (n) => `${n} players` }))
      .toEqual([{ key: 'events', value: '32' }, { key: 'winners', value: '24' }, { key: 'cards', value: '80' }, { key: 'mostWins', value: '4', small: 'Korda' }]);
    const { container } = wrap(<SeasonRecapBody tour="lpga" year={2026} data={kf({ cardLine: { label: 'TOP 80', n: 80 } })} />);
    expect([...container.querySelectorAll('[data-recap-fact]')].map((c) => [c.getAttribute('data-recap-fact'), c.querySelector('b')!.firstChild!.textContent]))
      .toEqual([['events', '25'], ['winners', '20'], ['cards', '80'], ['mostWins', '2']]);
  });
  it('card list over 20 shows See all, and the LPGA youngest line says her', () => {
    const big = kf({ cardLine: { label: 'TOP 80 · FULL STATUS FOR 2027', n: 80 } });
    const { container, unmount } = wrap(<SeasonRecapBody tour="lpga" year={2026} data={big} />);
    expect(container.querySelector('[data-recap-card]')).toBeNull();
    expect(container.querySelector('[data-recap-see-all]')!.textContent).toBe('See all 80 ›');
    unmount();
    const { container: c2 } = wrap(<SeasonRecapBody tour="lpga" year={2026} data={kf({ cardLine: { label: 'TOP 20', n: 20 } })} />);
    expect(c2.querySelector('[data-recap-youngest]')!.textContent).toContain('earned her card');
  });
  it('Our record hidden with no picks, shown with picks', () => {
    record.value = null;
    const { container, unmount } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
    expect(container.querySelector('[data-recap-record]')).toBeNull();
    unmount();
    record.value = { event_count: 21, won: 4, top10: 17 };
    const { container: c2 } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
    expect(c2.querySelector('[data-recap-record]')!.textContent).toContain('OUR RECORD · 2026');
    record.value = null;
  });
  it('Champions with no standings shows EVENTS / WINNERS / MOST WINS only', () => {
    const champ = stale(kf({ events: 28, winners: 19, maxWins: 4, mostWinsSurname: 'Alker' }));
    const { container } = wrap(<SeasonRecapBody tour="champ" year={2026} data={champ} />);
    expect([...container.querySelectorAll('[data-recap-fact]')].map((c) => c.getAttribute('data-recap-fact'))).toEqual(['events', 'winners', 'mostWins']);
    expect(container.querySelector('[data-recap-board]')).toBeNull();
  });
});
