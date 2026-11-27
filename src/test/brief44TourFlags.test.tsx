/** Brief 44 — flags replace avatars on every tour leaderboard; faceless biggest movers; chart colours
 * (live leader under-par red, champion gold). Structure only; colours read from the CSS sources. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }), Trans: () => null }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({ useBoardHoles: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/sections/CourseSection', () => ({ HolesSheet: () => null }));
import { LiveHeroBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard';
import { LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { LastYearRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow';
import { RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { HeroBoardRows } from '@/features/tourhub/tournament-v2/sections/HeroBoardRows';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { MoveSection } from '@/features/tourhub/tournament-v2/sections/MoveSection';
import { RaceSection } from '@/features/tourhub/tournament-v2/sections/TournamentV3Sections';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';

const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
afterEach(cleanup);

const entry = (id: string, pos: number, country: string | null): BoardEntry => ({ id, position: pos, score: -10 + pos, round_1: -4, round_2: -6 + pos, today: -6 + pos, today_round: 2, thru: 18, player: { id, full_name: `Player ${id}`, country_code: country } as never });
const field = [entry('a', 1, 'AUS'), entry('b', 2, 'NIR'), entry('c', 3, null)];

/** Every player row: flag straight after the name when there is a country, never an avatar. */
function expectFlagRows(rows: HTMLElement[], countries: (string | null)[]) {
  expect(rows.length).toBe(countries.length);
  rows.forEach((row, i) => {
    expect(row.querySelector('[style*="border-radius: 34%"], [data-squircle-avatar], [data-avatar]')).toBeNull();
    const flag = row.querySelector<HTMLElement>('[data-board-flag]');
    if (countries[i] == null) { expect(flag).toBeNull(); return; }
    expect(flag).not.toBeNull();
    expect(flag!.style.flex).toBe('0 0 auto'); // jsdom expands flex: none
    const name = flag!.previousElementSibling as HTMLElement;
    expect(name.textContent).toContain(`Player ${['a', 'b', 'c'][i]}`);
    expect(flag!.querySelectorAll('img, [role="img"]')).toHaveLength(1);
  });
}

describe('Brief 44 flags replace avatars', () => {
  it.each([['round1', 1], ['round2', 2]] as const)('overview live hero board (%s)', (stage, round) => {
    const { container } = mount(<LiveHeroBoard tournamentId="t" entries={field} stage={stage as never} round={round} nextRound={null} />);
    expectFlagRows([...container.querySelectorAll<HTMLElement>('[data-live-board-row]')], ['AUS', 'NIR', null]);
    expect(container.querySelector('.live-board-face')).toBeNull();
  });
  it.each([true, false])('leaders\' group (live=%s)', live => {
    const group = { teeTime: '2026-11-01T12:00:00Z', startingHole: 1, players: field.map(e => ({ id: e.player!.id, name: e.player!.full_name })) };
    const { container } = mount(<LeadersGroupContent tournamentId="t" entries={field} currentRound={2} totalRounds={4} phase="live" round={2} group={group as never} groups={[group as never]} live={live} />);
    const rows = [...container.querySelectorAll<HTMLElement>('[data-leaders-group-row]')];
    expectFlagRows(rows, rows.map(r => /Player a/.test(r.textContent ?? '') ? 'AUS' : /Player b/.test(r.textContent ?? '') ? 'NIR' : null).length === 3 ? ['AUS', 'NIR', null] : []);
    expect(container.querySelector('.live-leaders-face')).toBeNull();
  });
  it.each(['live', 'completed'] as const)('Also this week / hero board rows (%s)', phase => {
    const { container } = mount(<HeroBoardRows tournamentId="t" entries={field} rows={field} currentRound={2} phase={phase} tourSlug="pga" totalRounds={4} bleed flushTop />);
    expectFlagRows([...container.querySelectorAll<HTMLElement>('[data-hero-board-row]')], ['AUS', 'NIR', null]);
  });
  it('upcoming last-year row carries the flag; no country, no flag', () => {
    const { container } = mount(<><LastYearRow rank="1" name="Player a" score="−19" country="AUS" /><LastYearRow rank="2" name="Player b" score="−18" country="NIR" /><LastYearRow rank="3" name="Player c" score="−17" /></>);
    expectFlagRows([...container.querySelectorAll<HTMLElement>('[data-last-year-row]')], ['AUS', 'NIR', null]);
  });
  it.each(['live', 'completed'] as const)('tournament page MiniBoard, tournament presentation (%s)', phase => {
    const { container } = mount(<MiniBoard tournamentId="t" entries={field} currentRound={2} presentation="tournament" phase={phase} />);
    expectFlagRows([...container.querySelectorAll<HTMLElement>('.tv-board-row')], ['AUS', 'NIR', null]);
  });
  it('tournament page MiniBoard, panel presentation: flag after the name', () => {
    const { container } = mount(<MiniBoard tournamentId="t" entries={field} currentRound={2} theme="panel" phase="live" />);
    const rows = [...container.querySelectorAll<HTMLElement>('button')].filter(b => /Player [abc]/.test(b.textContent ?? ''));
    expectFlagRows(rows, ['AUS', 'NIR', null]);
  });
  it('a row with no country renders no flag and no empty element', () => {
    const { container } = mount(<LastYearRow rank="3" name="Player c" score="−17" />);
    const who = container.querySelector('[data-last-year-row]')!.children[1];
    expect(who.children).toHaveLength(1);
    expect(container.querySelector('[data-board-flag]')).toBeNull();
  });
  it('World rankings keep their avatar and flag badge', () => {
    const src = readFileSync('src/features/tourhub/overview/sections/WorldRankings.tsx', 'utf8');
    expect(src).toMatch(/Avatar/);
    expect(src).toContain('<CountryFlag country={row.country} size="sm" className="border-none" />');
    expect(src).not.toContain('BoardFlag');
  });
});

describe('Brief 44 biggest movers', () => {
  it('overview movers: initial + surname, no avatar, unchanged movement line', () => {
    const { container } = mount(<RoundMovementBand round={2} cards={[{ key: 'r', name: 'Ryan Taylor', candidates: [], delta: 104, toPar: -7, gross: null }, { key: 't', name: 'Tom Giroux', candidates: [], delta: 85, toPar: -7, gross: null }, { key: 'm', name: 'Madonna', candidates: [], delta: -102, toPar: 7, gross: null }]} />);
    const cards = [...container.querySelectorAll<HTMLElement>('[data-overview-movement-card]')];
    expect(cards.map(c => c.querySelector('[data-movement-name]')?.textContent)).toEqual(['R. Taylor', 'T. Giroux', 'Madonna']);
    const name = cards[0].querySelector<HTMLElement>('[data-movement-name]')!;
    expect(name.style.fontSize).toBe('15px'); expect(name.style.fontWeight).toBe('700');
    expect((name.nextElementSibling as HTMLElement).style.marginTop).toBe('3px');
    for (const c of cards) { expect(c.querySelector('img')).toBeNull(); expect(c.querySelector('[style*="width: 28px"]')).toBeNull(); }
    expect(cards[0].querySelector('[data-movement-dir]')?.textContent).toBe('▲');
    expect(cards[0].querySelector('[data-movement-places]')?.textContent).toBe('104');
    expect(cards[2].querySelector('[data-movement-dir]')?.textContent).toBe('▼');
    expect(cards[0].querySelector('[data-movement-topar]')?.textContent).toBe('−7');
  });
  it('tournament MoveSection: initial + surname, no avatar', () => {
    const row = { ...entry('r', 5, 'ENG'), player: { id: 'r', full_name: 'Ryan Taylor' } } as BoardEntry;
    const { container } = mount(<MoveSection contest={{ mover: row, moverToday: -7, pack: [] } as never} state="live" tourCode="pga" />);
    expect(container.querySelector('[data-movement-name]')?.textContent).toBe('R. Taylor');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('Brief 44 chart colours', () => {
  const meta = { id: 'e', name: 'T', venue_name: 'C', start_date: '2026-10-29', end_date: '2026-11-01', venue_par: 71, current_round: 3, current_round_status: 'complete', tour_code: 'pga', winner_id: 'a' } as TournamentMeta;
  const rows: BoardEntry[] = [{ id: 'a', player: { id: 'a', full_name: 'Andrew A' }, position: 1, score: -10, round_1: -2, round_2: -3, round_3: -5, thru: 18 }, { id: 'b', player: { id: 'b', full_name: 'Other B' }, position: 2, score: -8, round_1: -3, round_2: -2, round_3: -3, thru: 18 }];
  const css = readFileSync('src/features/tourhub/tournament-v2/tournamentPage.css', 'utf8');
  it('RaceSection: live leader line uses under-par red; completed champion stays gold', () => {
    const live = mount(<RaceSection meta={meta} phase="live" rows={rows} />);
    expect(live.container.querySelector('.tv-chart')?.getAttribute('data-race-phase')).toBe('live');
    expect(live.container.querySelector('.tv-winner')).not.toBeNull();
    cleanup();
    const done = mount(<RaceSection meta={meta} phase="completed" rows={rows} />);
    expect(done.container.querySelector('.tv-chart')?.getAttribute('data-race-phase')).toBe('completed');
    for (const rule of ['.tv-chart[data-race-phase=live] .tv-winner{stroke:var(--tv-under)}', '.tv-chart[data-race-phase=live] .tv-dot-winner{fill:var(--tv-under)}', '.tv-chart[data-race-phase=live] .tv-label-winner{fill:var(--tv-under)}', '.tv-chart .tv-winner{stroke:var(--tv-gold)', '.tv-chart .tv-dot-winner{fill:var(--tv-gold)}', '.tv-chart .tv-label-winner{fill:var(--tv-gold)'])
      expect(css).toContain(rule);
    expect(css).not.toContain('data-race-phase=completed');
  });
  it('WonChart: champion line, dots, positions and key score use --cw-gold; others\' under-par score stays red', () => {
    const cw = readFileSync('src/features/tourhub/tournament-v2/sections/completedWeek.css', 'utf8');
    expect(cw).toContain('--cw-gold:#FBBC2E');
    for (const rule of ['.cw-chart-champion{stroke:var(--cw-gold)', '.cw-chart-dot{fill:var(--cw-gold)', '.cw-chart-position{fill:var(--cw-gold)', '.cw-key-item[data-champion="true"]>i{height:2.4px;background:var(--cw-gold)}', '.cw-key-item[data-champion="true"] .cw-key-score{color:var(--cw-gold)}', '.cw-key-item[data-score-tone="under"] .cw-key-score{color:var(--cw-under)}', '.cw-key-item[data-champion="true"] .cw-key-name{color:var(--cw-ink);font-weight:700}'])
      expect(cw).toContain(rule);
    expect(cw).not.toContain('[data-score-tone="under"] .cw-chart-champion');
    expect(cw.indexOf('.cw-key-item[data-champion="true"] .cw-key-score')).toBeGreaterThan(cw.indexOf('.cw-key-item[data-score-tone="under"] .cw-key-score'));
  });
});
