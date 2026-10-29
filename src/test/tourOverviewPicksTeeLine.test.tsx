/* Picks tee line (option A). Mocks copied from tourOverviewPicksChipsFullBoard. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

const f = vi.hoisted(() => ({
  picks: [] as Array<{ playerId: string; playerName: string }>,
  rows: [] as unknown[],
  live: [] as Array<{ id: string }>,
  sheet: vi.fn(),
  tees: { data: undefined as Map<string, string> | undefined },
}));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => f.tees }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: f.picks.length ? { topContenders: f.picks, tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.rows }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: (id: string | null) => ({ data: id ? { id, name: 'Event meta' } : undefined }) }));
vi.mock('@/features/tourhub/overview/magazineCopy', () => ({
  tournamentHeadlineSegments: () => [{ text: 'Sentence.' }],
  tournamentHeadline: () => null,
}));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({
  FullBoardSheet: (props: { open: boolean; entries: unknown[]; meta: unknown }) => { f.sheet(props); return props.open ? <div data-testid="full-board-sheet" /> : null; },
}));

import { HeroBoardSection, pickTeeDayLabel, pickTeeText } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { formatDayMonthShortGB, formatTimeHm24, formatWeekdayLong, formatWeekdayShortGB } from '@/i18n/format';

const at = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(14, 5, 0, 0); return d.toISOString(); };
const idle = (id: string) => ({ id: `r${id}`, position: 1, position_tied: true, score: 0, player: { id, full_name: `Player ${id}` } }) as unknown as BoardEntry;
const mount = (entries: BoardEntry[], phase: 'live' | 'completed' = 'live') => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={entries} phase={phase} currentRound={1} totalRounds={4} venuePar={72} />
    </MemoryRouter>
  </QueryClientProvider>,
);
const card = () => document.querySelector('[data-overview-pick-card]') as HTMLElement;

describe('picks tee line', () => {
  afterEach(() => { cleanup(); f.tees = { data: undefined }; });
  it('unstarted pick with a tee time today shows the viewer-local time', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-tee]')).not.toBeNull();
    expect(card().querySelector('[data-overview-pick-tee-time]')?.textContent).toBe(formatTimeHm24(at(0)));
  });
  it('the card shows the time only: no TEES label, no weekday', () => {
    expect(pickTeeText(at(1))).toBe(formatTimeHm24(at(1)));
    expect(pickTeeText(at(0))).toBe(formatTimeHm24(at(0)));
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(3)]]) };
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    const tee = card().querySelector('[data-overview-pick-tee]')!;
    expect(tee.textContent).toBe(formatTimeHm24(at(3)));
    expect(tee.children.length).toBe(0);
  });
  it('a started pick shows position and score and no tee line', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), score: -1, thru: 2, position_tied: false } as BoardEntry, { ...idle('p2'), position: 2 } as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-figure]')).not.toBeNull();
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
  });
  it('no tee time, or a failed read, shows nothing', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
    expect(card().querySelector('[data-overview-pick-figure]')).toBeNull();
  });
  it('a completed event is unchanged', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: 1, position_tied: false, score: -10, round_1: -10 } as BoardEntry], 'completed');
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
    expect(card().querySelector('[data-overview-pick-figure]')).not.toBeNull();
  });
});

const T = (k: string, o?: Record<string, unknown>) => k.endsWith('picksTeeTimes') ? `TEE TIMES · ${o?.day}` : k.endsWith('Today') ? 'TODAY' : 'TOMORROW';
const on = (base: Date, days: number, h = 14) => { const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(h, 5, 0, 0); return d.toISOString(); };

describe('picks heading tee day', () => {
  const now = new Date(2026, 9, 28, 9, 0, 0); // Wed 28 Oct, local
  afterEach(() => { cleanup(); f.tees = { data: undefined }; });
  it('today', () => { expect(pickTeeDayLabel([on(now, 0)], now, T)).toBe('TEE TIMES · TODAY'); });
  it('tomorrow', () => { expect(pickTeeDayLabel([on(now, 1)], now, T)).toBe('TEE TIMES · TOMORROW'); });
  it('three days ahead: full weekday', () => {
    expect(pickTeeDayLabel([on(now, 3)], now, T)).toBe(`TEE TIMES · ${formatWeekdayLong(on(now, 3)).toLocaleUpperCase()}`);
  });
  it('nine days ahead: short weekday and date', () => {
    const d = on(now, 9);
    expect(pickTeeDayLabel([d], now, T)).toBe(`TEE TIMES · ${`${formatWeekdayShortGB(d)} ${formatDayMonthShortGB(d)}`.toLocaleUpperCase()}`);
  });
  it('tee times on different local days: WED–THU', () => {
    expect(pickTeeDayLabel([on(now, 1, 8), on(now, 0, 23)], now, T)).toBe(`TEE TIMES · ${formatWeekdayShortGB(on(now, 0)).toLocaleUpperCase()}–${formatWeekdayShortGB(on(now, 1)).toLocaleUpperCase()}`);
  });
  it('no label without tee times', () => { expect(pickTeeDayLabel([], now, T)).toBeNull(); });
  const heading = () => document.querySelector('[data-overview-picks-tee-day]');
  it('heading shows the label while a card shows a tee time', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(heading()).not.toBeNull();
  });
  it('no heading label with no tee sheet', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(heading()).toBeNull();
  });
  it('no heading label when completed', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: 1, position_tied: false, score: -10, round_1: -10 } as BoardEntry], 'completed');
    expect(heading()).toBeNull();
  });
  it('the label disappears when the last pick starts', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    const r = mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(heading()).not.toBeNull();
    r.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <HeroBoardSection tournamentId="event" entries={[{ ...idle('p1'), score: -1, thru: 2, position_tied: false } as BoardEntry, { ...idle('p2'), position: 2 } as BoardEntry]} phase="live" currentRound={1} totalRounds={4} venuePar={72} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(heading()).toBeNull();
  });

  it('card shows the 24-hour time and keeps the avatar', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-tee]')?.textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(card().querySelector('[data-overview-pick-avatar]')).not.toBeNull();
  });
  it('heading: full label when the row fits, day alone when it would overflow, back when it widens', () => {
    let rowW = 400;
    const cw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const ow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    const restore = (k: string, d?: PropertyDescriptor) => { if (d) Object.defineProperty(HTMLElement.prototype, k, d); else delete (HTMLElement.prototype as any)[k]; };
    const observers: Array<() => void> = [];
    const RO = globalThis.ResizeObserver;
    (globalThis as any).ResizeObserver = class { cb: () => void; constructor(cb: () => void) { this.cb = cb; observers.push(cb); } observe() {} disconnect() {} };
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return this.hasAttribute('data-overview-picks-heading') ? rowW : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get(this: HTMLElement) { return this.hasAttribute('data-overview-picks-tee-measure') ? 129 : 145; } });
    try {
      f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
      f.tees = { data: new Map([['p1', at(3)]]) };
      mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
      const day = formatWeekdayLong(at(3)).toLocaleUpperCase();
      const label = () => document.querySelector('[data-overview-picks-tee-day]')?.textContent;
      expect(label()).toBe(`TEE TIMES · ${day}`);
      rowW = 320; act(() => observers.forEach((cb) => cb()));
      expect(label()).toBe(day);
      rowW = 400; act(() => observers.forEach((cb) => cb()));
      expect(label()).toBe(`TEE TIMES · ${day}`);
    } finally {
      restore('clientWidth', cw);
      restore('offsetWidth', ow);
      (globalThis as any).ResizeObserver = RO;
    }
  });
});
