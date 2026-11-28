import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import en from '@/locales/en/tourhub.json';
import { LiveFacts } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import { UpcomingFacts } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import { WonChart } from '@/features/tourhub/tournament-v2/sections/WonChart';
import { startDayForm, heroStartDayForm } from '@/features/tourhub/tournament-v2/data/tournamentRules';
import type { WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { LiveFactCell } from '@/features/tourhub/components/overview-v3/liveStateRules';

vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ useOverviewChampion: () => ({ rows: [], needsInitials: false, champion: null, showChampion: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isFetched: true }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: null }) }));
vi.mock('@/features/tourhub/components/overview-v3/useUpcomingOverview', () => ({ useUpcomingOverview: () => ({ last: [], field: [], first: '2027-01-14T08:00:00Z', zone: 'UTC' }) }));

const i18n = createInstance();
await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });
const mount = (node: React.ReactNode) => render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
const cells: LiveFactCell[] = [{ key: 'lowRound', value: '64', toPar: null }, { key: 'scoringAvg', value: '70.25', toPar: null }, { key: 'underPar', value: '68%', toPar: null }, { key: 'cut', value: '−3', toPar: -3 }];
const start = '2027-01-14';

describe('Tour overview hero fixes', () => {
  it.each([4, 3])('LiveFacts with %i cells declares equal columns', count => {
    const { container } = mount(<LiveFacts cells={cells.slice(0, count)} />);
    expect(container.querySelector<HTMLElement>('[data-live-facts]')?.style.gridTemplateColumns).toBe(`repeat(${count}, minmax(0, 1fr))`);
    expect(container.querySelectorAll('[data-live-fact]')).toHaveLength(count);
  });
  it.each([
    [0, '2027-01-14T12:00:00Z', 'THURSDAY', true],
    [6, '2027-01-08T12:00:00Z', 'THURSDAY', true],
    [7, '2027-01-07T12:00:00Z', '14 JAN', false],
    [53, '2026-11-22T12:00:00Z', '14 JAN', false],
  ] as const)('startDayForm uses the required form at %i days', (_days, now, text, weekday) => {
    expect(startDayForm(start, 'UTC', new Date(now))).toEqual({ text, weekday });
  });
  it.each([
    [2, '2027-01-12T12:00:00Z', 'THURSDAY', true],
    [10, '2027-01-04T12:00:00Z', '14 JAN', false],
  ] as const)('heroStartDayForm preserves its output at %i days', (_days, now, text, weekday) => {
    expect(heroStartDayForm({ start_date: start, course_timezone: 'UTC', timezone: null } as TournamentMeta, new Date(now))).toEqual({ text, weekday });
  });
  it('date-only and timestamp starts retain event-zone calendar handling', () => {
    const now = new Date('2027-01-07T23:30:00Z');
    expect(startDayForm(start, 'Asia/Seoul', now)).toEqual({ text: 'THURSDAY', weekday: true });
    expect(startDayForm('2027-01-13T22:00:00Z', 'Asia/Seoul', now)).toEqual({ text: 'THURSDAY', weekday: true });
    expect(startDayForm(start, 'UTC', now)).toEqual({ text: '14 JAN', weekday: false });
  });
  it('missing starts and invalid zones retain safe empty and UTC handling', () => {
    expect(startDayForm(null, 'UTC')).toEqual({ text: '', weekday: false });
    expect(startDayForm('invalid', 'UTC')).toEqual({ text: '', weekday: false });
    expect(startDayForm(start, 'invalid', new Date('2027-01-08T12:00:00Z'))).toEqual({ text: 'THURSDAY', weekday: true });
  });
  it('the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE', () => {
    const now = new Date('2026-11-22T12:00:00Z');
    const form = startDayForm(start, 'UTC', now);
    const slide = { type: 'upcoming', tournament: { id: 'event', name: 'Champions event', startDate: start, endDate: '2027-01-17', tourSlug: 'champ', tourName: 'Champions', venueName: 'Course' } } as HeroSlide;
    const { container } = mount(<><HybridHero slide={slide} state={{ kind: 'upcoming', variant: 'far', countdown: '', meta: '' }} now={now} activeTournamentId="event" onSelectTour={() => {}} onOpenTournament={() => {}} /><UpcomingFacts first="2027-01-14T08:00:00Z" zone="UTC" field={132} purse={3000000} par={72} yards={7000} startDayNamed={form.weekday} /></>);
    expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('CHAMPIONS TOUR · Starts 14 JAN');
    expect(container.querySelector('[data-upcoming-fact="firstTee"]')).toBeNull();
    expect([...container.querySelectorAll('[data-upcoming-fact]')].map(c => c.getAttribute('data-upcoming-fact'))).toEqual(['field', 'purse', 'par', 'yards']);
    const caller = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx', 'utf8');
    expect(caller).toContain('startDayNamed={startDayForm(upcoming.startDate, upcoming.zone).weekday}');
  });
  it('WonChart keys use all three full names, champion first, with unchanged scores', () => {
    const rows: BoardEntry[] = ['David Puig', 'Wenyi Ding', 'Nick Voke'].map((full_name, i) => ({ id: String(i), player: { id: String(i), full_name }, position: i + 1, score: [-18, -16, -15][i], round_1: -3, round_2: -4, round_3: -5, round_4: [-6, -4, -3][i] }));
    const facts: WeekFacts = { champion_player_id: '0', champion_surname: 'Puig', rounds: 4, par: 71, path: [-3, -7, -12, -18].map((to_par, i) => ({ round: i + 1, position: 1, tied: false, to_par, back: null, lead_by: null })), playoff: false, margin: 2, hole_types: null, low_round: null, most_birdies: null, field_avg: null, field_size: null, cut: null, hardest: null, easiest: null };
    const { container } = mount(<WonChart facts={facts} rows={[rows[2], rows[0], rows[1]].filter((r): r is BoardEntry => r != null)} tourCode="euro" />);
    const key = [...container.querySelectorAll('[data-won-key-item]')];
    expect(key.map(c => c.querySelector('.cw-key-name')?.textContent)).toEqual(['David Puig', 'Wenyi Ding', 'Nick Voke']);
    expect(key.map(c => c.querySelector('.cw-key-score')?.textContent)).toEqual([' −18', ' −16', ' −15']);
    expect(key.map(c => c.getAttribute('data-champion'))).toEqual(['true', 'false', 'false']);
  });
  it('the won key wraps with a six-pixel row gap and never ellipsizes names', () => {
    const css = readFileSync('src/features/tourhub/tournament-v2/sections/completedWeek.css', 'utf8');
    const key = css.match(/\.cw-key\{([^}]+)\}/)?.[1];
    const name = css.match(/\.cw-key-name\{([^}]+)\}/)?.[1];
    expect(key).toContain('flex-wrap:wrap');
    expect(key).toContain('row-gap:6px');
    expect(name).toBeDefined();
    expect(name).not.toContain('text-overflow:ellipsis');
    expect(name).not.toContain('overflow:hidden');
  });
});