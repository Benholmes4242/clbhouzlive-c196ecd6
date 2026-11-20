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
import { BoardTable, boardHasMovementMark, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { wonByUnitKey } from '@/features/tourhub/leaderboard/leaderboardRules';
import { islandDescriptor } from '@/features/tourhub/components/tourIslandRules';

const f = vi.hoisted(() => ({
  entries: [] as BoardEntry[],
  meta: { current_round: 2, status: 'inprogress' as string | null } as Record<string, unknown>,
  tees: [] as unknown[],
  live: [{ id: 'event', name: 'Event', status: 'inprogress', currentRound: 2, tourSlug: 'pga' }] as unknown[],
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }), Trans: () => null }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live, isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.entries, isLoading: false }), useTourTeeTimesEnriched: () => ({ data: f.tees }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/heroStateLine', () => ({ heroStateLine: (_t: unknown, st: { kind: string; round?: number; afterRound?: number | null }) => `STATE:${st.kind}:${st.round ?? ''}:${st.afterRound ?? ''}` }));
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
afterEach(() => { cleanup(); f.entries = []; f.meta = { current_round: 2, status: 'inprogress' }; f.tees = []; });

describe('Leaderboards page — islands, not a header bar', () => {
  it('the live tab renders outside TourPageShell, under the shared islands', () => {
    const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
    /* NEWS ON THE SHARED ISLANDS (10 Nov 2026): every tab now renders
       directly — the hub no longer imports TourPageShell at all. */
    expect(main).not.toContain('<TourPageShell');
    expect(main).not.toContain("import { TourPageShell }");
    expect(main).toContain('{renderTab()}');
  });
  it('the TourIsland reads the Leaderboards label with its live caption', () => {
    const d = islandDescriptor({ activeTab: 'live', activeTourSlug: 'pga', rows: [], liveCount: 1, major: null, liveRound: () => 4 });
    expect(d.label).toBe('Leaderboards');
    expect(d.captionLive).toBe(true);
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
  it('live below the field gate shows ON COURSE and LOW TODAY, no lead and no average', () => {
    f.entries = Array.from({ length: 19 }, (_, i) => ({ ...entry(`p${i}`, i + 1), thru: 18 }));
    f.entries.push({ ...entry('out', 20), thru: 3 });
    const v = mountTab();
    expect(v.container.querySelector('[data-stat="lead"]')).toBeNull();
    expect(v.container.querySelector('[data-stat="oncourse"]')).not.toBeNull();
    const low = v.container.querySelector<HTMLElement>('[data-stat="low"]');
    expect(low).not.toBeNull();
    expect(low?.querySelector('b')?.firstChild?.textContent).toBe('−2');
    expect(v.container.querySelector('[data-stat="average"]')).toBeNull();
  });
  it('live at the gate adds FIELD AVERAGE TODAY as the third cell', () => {
    f.entries = Array.from({ length: 20 }, (_, i) => ({ ...entry(`p${i}`, i + 1), thru: 18 }));
    f.entries.push({ ...entry('out', 21), thru: 3 });
    const v = mountTab();
    const cells = v.container.querySelectorAll('.tour-board-figures > div[data-stat]');
    expect(v.container.querySelector('[data-stat="average"]')).not.toBeNull();
    expect(cells.length).toBe(3);
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
    expect(v.container.querySelector('[data-board-pos-header] .tour-board-section-title')).not.toBeNull();
    expect(css).toContain('.tour-board-section-title { margin:0; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--tour-board-ink); white-space:nowrap; }');
  });
  it('the search button toggles the SearchFieldBox row above the column-header row', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    expect(v.container.querySelector('input')).toBeNull();
    fireEvent.click(v.container.querySelector('.tour-board-search-btn') as HTMLElement);
    const input = v.container.querySelector('input');
    expect(input).not.toBeNull();
    const header = v.container.querySelector('[data-board-sticky-header]') as HTMLElement;
    expect(input!.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

describe('Leaderboards page — between rounds and not-yet-started rounds', () => {
  const r1Only = (id: string, position: number): BoardEntry => ({ id, position, score: -2, thru: null, today: null, today_round: null, round_1: -2, round_2: null, player: { id, full_name: `Player ${id}` } });
  const legend = (c: HTMLElement) => c.querySelector('.tour-board-legend-caption');
  it('(a) between rounds: AFTER ROUND 1 kicker, no LIVE marker, no figure row, no legend', () => {
    f.meta = { current_round: 2, status: 'inprogress', start_date: '2026-11-19', end_date: '2026-11-22' };
    f.entries = [r1Only('a', 1), { ...r1Only('b', 2), round_1: -1, score: -1 }];
    const v = mountTab();
    expect(v.container.querySelectorAll('.tour-board-movement').length).toBe(0);
    expect(v.container.querySelector('.tour-board-kicker-row')?.textContent).toContain('STATE:live:2:1');
    expect(v.container.querySelector('.tour-board-live')).toBeNull();
    expect(v.container.querySelector('.tour-board-figures')).toBeNull();
    expect(legend(v.container)).toBeNull();
  });
  it('(b) between rounds with tee times: venue-zone time in THRU; a started row shows thru', () => {
    f.meta = { current_round: 2, status: 'inprogress', start_date: '2026-11-19', end_date: '2026-11-22', course_timezone: 'America/New_York' };
    f.entries = [r1Only('a', 1), { ...r1Only('b', 2), today: -1, today_round: 2, thru: 4 }];
    f.tees = [{ tee_time: '2026-11-20T17:10:00Z', players: [{ player: { id: 'a' } }] }];
    const v = mountTab();
    const cells = Array.from(v.container.querySelectorAll<HTMLElement>('[data-board-thru-cell]')).map(c => c.textContent);
    expect(cells).toContain('12:10');
    expect(cells).toContain('4');
  });
  it('(c) mid round: started shows thru, unstarted shows tee time, kicker ROUND 2 with LIVE', () => {
    f.meta = { current_round: 2, status: 'inprogress', start_date: '2026-11-19', end_date: '2026-11-22', timezone: 'America/New_York' };
    f.entries = [{ ...entry('a'), thru: 9 }, r1Only('b', 2)];
    f.tees = [{ tee_time: '2026-11-20T18:30:00Z', players: [{ player: { id: 'b' } }] }];
    const v = mountTab();
    const cells = Array.from(v.container.querySelectorAll<HTMLElement>('[data-board-thru-cell]')).map(c => c.textContent);
    expect(cells).toEqual(expect.arrayContaining(['9', '13:30']));
    expect(v.container.querySelector('.tour-board-kicker-row')?.textContent).toContain('STATE:live:2:');
    expect(v.container.querySelector('.tour-board-kicker-row')?.textContent).not.toContain('STATE:live:2:1');
    expect(v.container.querySelector('.tour-board-live')).not.toBeNull();
  });
  it('(d) WON BY unit is singular at one shot, plural otherwise', () => {
    expect(wonByUnitKey(1)).toBe('rebuilt.shot');
    expect(wonByUnitKey(3)).toBe('rebuilt.shots');
    expect(source('src/features/tourhub/leaderboard/LeaderboardTab.tsx')).toContain('small: t(wonByUnitKey(lead.lead))');
  });
  it('(e) the movement legend renders only when a movement mark exists', () => {
    const moved = [{ ...entry('a', 1), round_1: 2, round_2: -8, score: -6 }, { ...entry('b', 2), round_1: -4, round_2: 0, score: -4 }];
    expect(boardHasMovementMark(moved, 2)).toBe(true);
    f.entries = moved;
    const v = mountTab();
    expect(v.container.querySelectorAll('.tour-board-movement').length).toBeGreaterThan(0);
    expect(legend(v.container)).not.toBeNull();
    cleanup();
    const still = [{ ...entry('a', 1), round_1: -4, round_2: -2 }, { ...entry('b', 2), round_1: -2, round_2: -2, score: -4 }];
    expect(boardHasMovementMark(still, 2)).toBe(false);
    f.entries = still;
    const w = mountTab();
    expect(w.container.querySelectorAll('.tour-board-movement').length).toBe(0);
    expect(legend(w.container)).toBeNull();
  });
});

describe('Leaderboards page — top spacing and title in the board header', () => {
  it('(f) the events row pads 4px 18px 0 and the top block sits 14px under the pills', () => {
    const css = source('src/features/tourhub/leaderboard/leaderboard.css');
    expect(css).toContain('.tour-board-events { display:flex; gap:8px; padding:4px 18px 0;');
    expect(css).toContain('.tour-board-events + .tour-board-top { margin-top:14px; }');
  });
  it('(g) headerLead renders inside [data-board-pos-header]; empty without it; not in the pre-tournament header', () => {
    const lead = <span data-test-lead />;
    const withLead = mount(<BoardTable entries={[entry('a')]} cutState={cut} currentRound={2} headerLead={lead} />);
    expect(withLead.container.querySelector('[data-board-pos-header] [data-test-lead]')).not.toBeNull();
    cleanup();
    const without = mount(<BoardTable entries={[entry('a')]} cutState={cut} currentRound={2} />);
    expect(without.container.querySelector('[data-board-pos-header]')?.childNodes.length).toBe(0);
    cleanup();
    const pre: BoardEntry = { id: 'p', position: null, score: null, thru: null, today: null, today_round: null, player: { id: 'p', full_name: 'Player p' } };
    const preV = mount(<BoardTable entries={[pre]} cutState={cut} currentRound={1} headerLead={lead} />);
    expect(preV.container.querySelector('[data-board-sticky-header]')).not.toBeNull();
    expect(preV.container.querySelector('[data-test-lead]')).toBeNull();
  });
  it('(h) the page renders no section head and no default LEADERBOARD kicker', () => {
    f.entries = [entry('a')];
    const v = mountTab();
    expect(v.container.querySelector('.tour-board-section-head')).toBeNull();
    expect(v.container.querySelector('.tour-board-kicker')).toBeNull();
  });
});
