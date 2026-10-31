import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { MiniBoard, heroTeeRound } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { BOARD_GEOMETRY, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { leadersPositionOrder } from '@/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupRules';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';
import { formatTimeHm24 } from '@/i18n/format';

const f = vi.hoisted(() => ({ draw: [] as TeeGroup[], picks: [] as { playerId: string; playerName: string }[], read: vi.fn() }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: (_id: string, round: number, options: { enabled: boolean }) => { f.read(round, options.enabled); return { data: options.enabled ? f.draw : [], isLoading: false }; } }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: { topContenders: f.picks } }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
const language = i18next.createInstance();
void language.init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false });
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter></QueryClientProvider>);
const row = (id: string, position: number): BoardEntry => ({ id, position, score: -14 + position - 1, round_1: -4, round_2: -10 + position - 1, today: -10 + position - 1, today_round: 2, thru: 18, player: { id, full_name: `Player ${id}` } });
const field = [row('a', 1), row('b', 2), row('c', 3)];
const tee = new Date(2026, 9, 31, 13, 5).toISOString();
const group: TeeGroup = { teeTime: tee, startingHole: 1, players: [{ id: 'c', name: 'Player c' }, { id: 'a', name: 'Player a' }, { id: 'b', name: 'Player b' }] };
afterEach(() => { cleanup(); f.draw = []; f.picks = []; f.read.mockClear(); });
const board = (entries = field, phase: 'live' | 'completed' = 'live') => mount(<MiniBoard tournamentId="event" entries={entries} currentRound={3} theme="heroBoard" phase={phase} />);

describe('Tour hero refinements', () => {
  it('centres every round and total header/cell on independent 32px tracks', () => {
    const v = board();
    const header = v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.gridTemplateColumns).toBe('24px minmax(0, 1fr) 32px 32px 32px 40px');
    expect(header?.style.gap).toBe('4px');
    expect(header?.style.paddingLeft).toBe('20px');
    for (const el of [header, ...v.container.querySelectorAll<HTMLElement>('[data-hero-tie]')].map(el => el?.hasAttribute('data-hero-tie') ? el.parentElement : el)) {
      Array.from(el?.children ?? []).slice(2).forEach(cell => expect((cell as HTMLElement).style.textAlign).toBe('center'));
    }
    expect(BOARD_GEOMETRY).toEqual({ mov: 24, pos: 24, tot: 40, today: 40, thru: 34, prize: 52, cell: 26, cellFloor: 22, gap: 4 });
  });
  it('centres live TODAY, shape and TOT without resizing the full board', () => {
    const v = board(field.map(e => ({ ...e, today: -1, today_round: 3, thru: 4 })));
    const header = v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.gridTemplateColumns).toBe('24px minmax(0,1fr) 40px 44px 40px');
    Array.from(header?.children ?? []).slice(2).forEach(el => expect((el as HTMLElement).style.textAlign).toBe('center'));
    v.container.querySelectorAll<HTMLElement>('[data-hero-shape]').forEach(el => { expect(el.style.justifyContent).toBe('center'); expect(el.style.textAlign).toBe('center'); });
  });
  it('shows a known next-round tee time in its centred dim 11px cell', () => {
    f.draw = [group]; const v = board();
    const cells = v.container.querySelectorAll<HTMLElement>('[data-hero-round="3"]');
    expect(cells[0].textContent).toBe(formatTimeHm24(tee));
    expect(cells[0].style.fontSize).toBe('11px');
    expect(cells[0].style.color).toBe('rgba(255, 255, 255, 0.45)');
    expect(f.read).toHaveBeenCalledWith(3, true);
  });
  it('keeps a passed tee time when the round has not started', () => {
    f.draw = [{ ...group, teeTime: '2020-01-01T13:05:00Z' }]; const v = board();
    expect(v.container.querySelector('[data-hero-round="3"]')?.textContent).toBe(formatTimeHm24('2020-01-01T13:05:00Z'));
  });
  it('renders the score instead of a tee when that player has a round score', () => {
    f.draw = [group]; const v = board(field.map(e => ({ ...e, round_3: -2, today: -2, today_round: 3 })));
    expect(v.container.querySelector('[data-hero-round="3"]')?.textContent).toBe('−2');
    expect(v.container.querySelector('[data-hero-tee]')).toBeNull();
  });
  it('keeps an unknown tee time blank', () => {
    f.draw = [{ ...group, players: [] }]; const v = board();
    expect(v.container.querySelector('[data-hero-round="3"]')?.textContent).toBe('');
  });
  it('never reads or prints tee times on completed events', () => {
    f.draw = [group]; const v = board(field, 'completed');
    expect(f.read.mock.calls.every(([, enabled]) => !enabled)).toBe(true);
    expect(v.container.querySelector('[data-hero-tee]')).toBeNull();
  });
  it('does not enable a tee read when every visible player has a score', () => {
    board(field.map(e => ({ ...e, round_3: -2, today: -2, today_round: 3 })));
    expect(f.read.mock.calls.every(([, enabled]) => !enabled)).toBe(true);
  });
  it('never requests a played round for a missing score or a non-hero board', () => {
    expect(heroTeeRound(field, field, [1, 2, 3], 3, false)).toBe(3);
    expect(heroTeeRound(field, field, [1, 2], 3, false)).toBeNull();
    const v = mount(<MiniBoard tournamentId="event" entries={field} currentRound={3} theme="panel" />);
    expect(f.read.mock.calls.every(([, enabled]) => !enabled)).toBe(true);
    expect(v.container.querySelector('[data-hero-tee]')).toBeNull();
  });
  it('renders the Needs gross as a separate untruncated white figure and omits leading/level picks', () => {
    const entries = [row('a', 1), { ...row('b', 2), score: -8 }, { ...row('c', 2), score: -14 }];
    f.picks = entries.map(e => ({ playerId: e.id, playerName: e.player?.full_name ?? '' }));
    const v = mount(<HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={3} totalRounds={4} venuePar={72} />);
    const lines = v.container.querySelectorAll<HTMLElement>('[data-overview-pick-to-reach]');
    expect(lines).toHaveLength(1);
    expect(lines[0].children[1].textContent).toBe('66');
    expect(lines[0].style.textOverflow).toBe('');
    expect(lines[0].style.overflow).toBe('');
    expect(lines[0].style.gap).toBe('4px');
    expect(lines[0].style.textTransform).toBe('uppercase');
  });
  it('sorts leaders by position stably with MC/WD last without changing the draw', () => {
    const entries = [row('a', 1), row('b', 2), row('c', 2), { ...row('mc', 70), status: 'MC' }, { ...row('wd', 80), status: 'WD' }];
    const players = ['mc', 'c', 'wd', 'a', 'b'].map(id => ({ id, name: id }));
    expect(leadersPositionOrder(players, entries).map(p => p.id)).toEqual(['a', 'c', 'b', 'mc', 'wd']);
    expect(players.map(p => p.id)).toEqual(['mc', 'c', 'wd', 'a', 'b']);
  });
  it('aligns the leaders headers/rows and holds thru/today empty before tee-off', () => {
    const v = mount(<LeadersGroupContent tournamentId="event" entries={field} phase="live" currentRound={3} totalRounds={4} round={3} group={group} groups={[group]} />);
    const header = v.container.querySelector<HTMLElement>('[data-leaders-group-header]');
    expect(header?.style.gridTemplateColumns).toBe('24px minmax(0,1fr) 40px 40px 40px');
    expect(header?.style.gap).toBe('4px');
    Array.from(header?.children ?? []).slice(2).forEach(el => expect((el as HTMLElement).style.textAlign).toBe('center'));
    expect(v.container.querySelector('[data-group-state="before"]')).not.toBeNull();
    v.container.querySelectorAll<HTMLElement>('[data-leaders-group-row]').forEach(el => { expect(el.style.gap).toBe('4px'); Array.from(el.children).slice(2).forEach(cell => expect((cell as HTMLElement).style.textAlign).toBe('center')); });
    expect([...v.container.querySelectorAll('[data-group-thru], [data-group-today]')].every(el => el.textContent === '')).toBe(true);
  });
});