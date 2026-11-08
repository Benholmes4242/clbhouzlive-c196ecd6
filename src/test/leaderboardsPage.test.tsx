/**
 * LEADERBOARDS PAGE (8 Nov 2026, leaderboards-page.html "Proposed").
 * The tab drops the TourPageShell header bar for the shared islands, gains
 * the kicker/title/place/figures top block, an ink LEADERBOARD section head
 * with the search toggle, and the board at the Tour overview board's sizes
 * with a TOUR_LIVE_GREEN current-round header. Structure is asserted, never
 * translated words: the react-i18next mock is the canonical one.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fs from 'node:fs';
import path from 'node:path';
import { LeaderboardTab } from '@/features/tourhub/leaderboard/LeaderboardTab';
import { BoardTable, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { islandDescriptor } from '@/features/tourhub/components/tourIslandRules';

const f = vi.hoisted(() => ({
  entries: [] as BoardEntry[],
  meta: { current_round: 2, status: 'inprogress' as string | null } as Record<string, unknown>,
  live: [{ id: 'event', name: 'Event', status: 'inprogress', currentRound: 2, tourSlug: 'pga' }] as unknown[],
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }), Trans: () => null }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live, isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.entries, isLoading: false }), useTourTeeTimesEnriched: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: f.meta }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set(), toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({ useBoardHoles: () => ({ byPlayer: new Map() }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
const entry = (id: string, position = 1): BoardEntry => ({ id, position, score: -4, thru: 3, today: -2, today_round: 2, round_1: -2, round_2: -2, player: { id, full_name: `Player ${id}` } });
const cut = { kind: 'none' as const, cutline: null, extraCount: 0 };
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const mountTab = () => mount(<LeaderboardTab />);
afterEach(() => { cleanup(); f.entries = []; f.meta = { current_round: 2, status: 'inprogress' }; });

describe('Leaderboards page — islands, not a header bar', () => {
  it('the live tab renders outside TourPageShell, under the shared islands', () => {
    const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
    expect(main).toContain("activeTab === 'live' ? renderTab()");
  });
  it('the TourIsland reads the Leaderboards label with its live caption', () => {
    const d = islandDescriptor({ activeTab: 'live', activeTourSlug: 'pga', rows: [], liveCount: 1, major: null, liveRound: () => 4 });
    expect(d.label).toBe('Leaderboards');
    expect(d.captionLive).toBe(true);
  });
  it('SubTabTourControl stays: the news/schedule/players tabs still use it', () => {
    const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
    expect(main).toContain('<SubTabTourControl');
  });
});

describe('Leaderboards page — top block', () => {
  it('the title wraps with no nowrap or ellipsis', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    const h1 = v.container.querySelector<HTMLElement>('.tour-board-title');
    expect(h1).not.toBeNull();
    expect(h1?.style.whiteSpace).not.toBe('nowrap');
    expect(h1?.style.textOverflow).not.toBe('ellipsis');
  });
  it('the old title-line marker/search and stats block are gone', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    expect(v.container.querySelector('.tour-event-title-line')).toBeNull();
    expect(v.container.querySelector('.tour-board-stats')).toBeNull();
  });
  it('live below the field gate shows LEAD, ON COURSE and LOW TODAY, no average', () => {
    f.entries = Array.from({ length: 19 }, (_, i) => ({ ...entry(`p${i}`, i + 1), thru: 18 }));
    f.entries.push({ ...entry('out', 20), thru: 3 });
    const v = mountTab();
    expect(v.container.querySelector('[data-stat="lead"]')).not.toBeNull();
    expect(v.container.querySelector('[data-stat="oncourse"]')).not.toBeNull();
    const low = v.container.querySelector<HTMLElement>('[data-stat="low"]');
    expect(low).not.toBeNull();
    expect(low?.querySelector('b')?.firstChild?.textContent).toBe('−2');
    expect(v.container.querySelector('[data-stat="average"]')).toBeNull();
  });
  it('live at the gate adds FIELD AVERAGE TODAY as the fourth cell', () => {
    f.entries = Array.from({ length: 20 }, (_, i) => ({ ...entry(`p${i}`, i + 1), thru: 18 }));
    f.entries.push({ ...entry('out', 21), thru: 3 });
    const v = mountTab();
    const cells = v.container.querySelectorAll('.tour-board-figures > div[data-stat]');
    expect(v.container.querySelector('[data-stat="average"]')).not.toBeNull();
    expect(cells.length).toBe(4);
  });
  it('finished shows WON BY / FIELD, ROUND n / LOW ROUND', () => {
    f.meta = { current_round: 4, status: 'closed' };
    f.entries = Array.from({ length: 20 }, (_, i) => ({
      ...entry(`p${i}`, i + 1), thru: 18, today: null, today_round: null,
      round_1: -2, round_2: -2, round_3: -2, round_4: i === 0 ? -6 : -1,
    }));
    const v = mountTab();
    expect(v.container.querySelector('[data-stat="wonby"]')).not.toBeNull();
    expect(v.container.querySelector('[data-stat="fieldround"]')).not.toBeNull();
    const low = v.container.querySelector<HTMLElement>('[data-stat="lowround"]');
    expect(low).not.toBeNull();
    expect(low?.querySelector('b')?.firstChild?.textContent).toBe('−6');
    expect(v.container.querySelector('[data-stat="lead"]')).toBeNull();
  });
});

describe('Leaderboards page — section head and search', () => {
  it('LEADERBOARD is ink, not amber', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    expect(v.container.querySelector('.tour-board-section-title')).not.toBeNull();
    const css = source('src/features/tourhub/leaderboard/leaderboard.css');
    expect(css).toContain('.tour-board-section-title { margin:0; font-size:10px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-ink); }');
  });
  it('the search button toggles the SearchFieldBox row beneath the section head', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    const head = v.container.querySelector('.tour-board-section-head');
    expect(head).not.toBeNull();
    expect(v.container.querySelector('input')).toBeNull();
    fireEvent.click(v.container.querySelector('.tour-board-search-btn') as HTMLElement);
    const input = v.container.querySelector('input');
    expect(input).not.toBeNull();
    expect(head?.nextElementSibling?.contains(input ?? null)).toBe(true);
    fireEvent.click(v.container.querySelector('.tour-board-search-btn') as HTMLElement);
    expect(v.container.querySelector('input')).toBeNull();
  });
});

describe('Leaderboards page — the board at the overview board sizes', () => {
  const board = (entries: BoardEntry[], extra: Partial<Parameters<typeof BoardTable>[0]> = {}) =>
    render(<MemoryRouter><BoardTable entries={entries} cutState={cut} currentRound={2} {...extra} /></MemoryRouter>);
  it('the current live round header is TOUR_LIVE_GREEN, and not green when finished', () => {
    const v = board([entry('a')]);
    const headers = Array.from(v.container.querySelectorAll<HTMLElement>('[data-board-round-header]'));
    expect(headers[1].style.color).toBe('rgb(52, 215, 127)');
    cleanup();
    const done = board([entry('a')], { complete: true });
    for (const h of Array.from(done.container.querySelectorAll<HTMLElement>('[data-board-round-header]'))) {
      expect(h.style.color).not.toBe('rgb(52, 215, 127)');
    }
  });
  it('row sizes: name 13, rounds 12, TOT 15, min-height 31', () => {
    const v = board([entry('a')]);
    const row = v.container.querySelector<HTMLElement>('[data-board-row]');
    expect(row?.style.minHeight).toBe('31px');
    expect(row?.querySelector<HTMLElement>('[data-board-round-cell]')?.style.fontSize).toBe('12px');
    const tot = row?.querySelector<HTMLElement>('[data-board-thru-cell]')?.nextElementSibling as HTMLElement | null;
    expect(tot?.style.fontSize).toBe('15px');
    expect(tot?.style.fontWeight).toBe('700');
    const css = source('src/features/tourhub/leaderboard/leaderboard.css');
    expect(css).toContain('.tour-board-name { display:flex; align-items:center; gap:5px; font-size:13px;');
  });
  it('the column header is one merged POS PLAYER cell at the signed-off size', () => {
    const v = board([entry('a')]);
    const head = v.container.querySelector<HTMLElement>('[data-board-pos-header]');
    expect(head).not.toBeNull();
    expect(head?.style.fontSize).toBe('10px');
    expect(head?.parentElement?.style.minHeight).toBe('26px');
    expect(head?.parentElement?.style.borderBottom).toBe('1px solid rgba(255,255,255,0.08)');
  });
  it('movement down is mute, never red', () => {
    const v = board([{ ...entry('a'), round_1: -4, round_2: -2 }, { ...entry('b', 2), round_1: 2, round_2: -2 }]);
    for (const m of Array.from(v.container.querySelectorAll<HTMLElement>('.tour-board-movement'))) {
      expect(m.style.color).not.toBe('rgb(226, 75, 63)');
    }
  });
  it('FullBoardSheet shares BoardTable through LiveBoard with no duplicate header', () => {
    const sheet = source('src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx');
    expect(sheet).toContain('<LiveBoard');
    expect(sheet).not.toContain('data-board-round-header');
  });
});
