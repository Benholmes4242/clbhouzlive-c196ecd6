import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroTournament } from '@/features/tourhub/hooks/useHeroCarouselData';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isSuccess: true }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: ({ open, target }: { open: boolean; target: { playerId: string } | null }) => open ? <div data-open-scorecard={target?.playerId} /> : null }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: ({ alt }: { alt: string }) => <div data-face={alt} /> }));
import { hybridLiveTiles, hybridUpcomingTiles, hybridCompletedTiles, hybridCutFooter, hybridBoardRounds, hybridFinalWeekday } from '@/features/tourhub/components/overview-v3/hybridOverviewRules';
import { overviewStrokeCard, overviewSkinsCard } from '@/features/tourhub/components/overview-v3/OverviewHybridPhoto';
import { HybridBoard, HybridCourse } from '@/features/tourhub/components/overview-v3/OverviewHybridSections';
import { HybridGlassCard } from '@/features/tourhub/components/overview-v3/HybridPhotoFrame';
import { hybridPickStatus } from '@/features/tourhub/components/overview-v3/OverviewHybridPicks';
import { OverviewTourSwitcher } from '@/features/tourhub/components/overview-v3/OverviewTourSwitcher';
import { HybridRecapCards, HybridRecapStandings } from '@/features/tourhub/components/overview-v3/OverviewHybridRecap';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';
import { skinsFromScorecards } from '@/features/tourhub/skins/skinsRules';

afterEach(cleanup);
const row = (id: string, extra: Partial<BoardEntry> = {}): BoardEntry => ({ id, position: 1, score: -3, round_1: -1, round_2: -2, thru: 18, player: { id, sr_id: `sr:${id}`, full_name: `Alex ${id}`, country_code: 'USA' }, ...extra });
const rows = [row('A'), row('B', { position: 2, score: 1, round_2: 2, thru: 9 }), row('C', { position: 3, score: 2, round_2: null, thru: 0, status: 'MC' })];
const noCut = { status: 'inprogress', currentRound: 2, cutRound: null };
const input = { stage: 'cutRound' as const, round: 2, entries: rows, par: 72, purse: 1000000, cut: noCut };
const tm = { winnerId: 'sr:A', eventType: 'stroke', tourSlug: 'pga', venuePar: 72, endDate: '2026-11-29' } as HeroTournament;
describe('Brief 48 live tile rules', () => {
  it.each(['round1', 'inPlay', 'cutRound', 'suspended'] as const)('%s uses finished, low round and scoring average without a cut tile', stage => {
    const cells = hybridLiveTiles({ ...input, stage });
    expect(cells.map(c => c.key)).toEqual(['finished', 'lowRound', 'scoringAvg']);
    expect(cells[0]).toMatchObject({ finished: 1, playing: 3 });
    expect(cells[1].value).toBe('−2'); expect(cells[2].value).toBe('70.00');
  });
  it('after-cut playing and made-cut figures exclude the missed cut', () => {
    const cells = hybridLiveTiles({ ...input, stage: 'afterCut' });
    expect(cells.map(c => c.key)).toEqual(['finished', 'lowRound', 'madeCut']);
    expect(cells[0].playing).toBe(2); expect(cells[2].value).toBe('2');
  });
  it('between rounds drops the ring and retains three figures', () => expect(hybridLiveTiles({ ...input, stage: 'between' }).map(c => c.key)).toEqual(['lowRound', 'scoringAvg', 'underPar']));
  it('before tee keeps only the first three present field facts', () => expect(hybridLiveTiles({ ...input, stage: 'beforeTee', yards: 7449 }).map(c => c.key)).toEqual(['field', 'purse', 'par']));
  it('missing scoring average drops its tile rather than supplying a number', () => expect(hybridLiveTiles({ ...input, entries: rows.map(e => ({ ...e, thru: 9 })) }).map(c => c.key)).toEqual(['finished', 'lowRound']));
  it('final round uses the lead instead of average', () => expect(hybridLiveTiles({ ...input, stage: 'final' }).map(c => c.key)).toEqual(['finished', 'lowRound', 'lead']));
  it('team events keep the finished count and team field count', () => { const cells = hybridLiveTiles(input, true); expect(cells[0].playing).toBe(3); expect(cells[2]).toMatchObject({ key: 'teams', value: '3' }); });
});
describe('Briefs 48/48A cut and board rules', () => {
  it('projects only active players at or better than the cutline', () => expect(hybridCutFooter({ currentRound: 2, cutRound: 2, projectedCutline: -1 }, rows)).toEqual({ kind: 'projected', line: '−1', count: 1 }));
  it('after the cut never reuses a stale projection', () => { expect(hybridCutFooter({ currentRound: 3, cutRound: 2, cutline: -2, projectedCutline: 0 }, rows)).toEqual({ kind: 'actual', line: '−2', count: 2 }); expect(hybridCutFooter({ currentRound: 3, cutRound: 2, projectedCutline: 0 }, rows)).toBeNull(); });
  it('no-cut events have no footer', () => expect(hybridCutFooter(noCut, rows)).toBeNull());
  it.each([[1, []], [2, [2]], [4, [4]]] as const)('live round %i selects only the current round column', (n, expected) => expect(hybridBoardRounds(n, false)).toEqual(expected));
  it('a 54-hole final selects three round columns', () => expect(hybridBoardRounds(3, true)).toEqual([1, 2, 3]));
  it('board shows ten rows, not the entire field, and opens the canonical scorecard', () => {
    const entries = Array.from({ length: 12 }, (_, i) => row(`p${i}`, { position: i + 1 }));
    const { container } = render(<MemoryRouter><HybridBoard tournamentId="event" entries={entries} round={2} cut={noCut} /></MemoryRouter>);
    expect(container.querySelectorAll('[data-hybrid-board-row]')).toHaveLength(10);
    fireEvent.click(container.querySelector('[data-hybrid-board-row]') as HTMLElement);
    expect(container.querySelector('[data-open-scorecard]')).toHaveAttribute('data-open-scorecard', 'p0');
    expect(container.querySelector('[data-clbhouz-pick-mark]')).toBeNull();
  });
  it('team rows deduplicate identical countries while retaining both distinct flags', () => {
    const team = row('team', { player: null, team: { abbr_name: 'Kim / Wilson', members: [{ player: { id: 'a', full_name: 'Gina Kim', country: 'USA' } }, { player: { id: 'b', full_name: 'Yana Wilson', country: 'USA' } }] } });
    const view = render(<MemoryRouter><HybridBoard tournamentId="event" entries={[team]} round={1} cut={noCut} /></MemoryRouter>);
    expect(view.container.querySelectorAll('[data-hybrid-board-row] [data-board-flag]')).toHaveLength(1);
    team.team = { ...team.team, members: [{ player: { full_name: 'Gina Kim', country: 'USA' } }, { player: { full_name: 'Yana Wilson', country: 'GBR' } }] };
    view.rerender(<MemoryRouter><HybridBoard tournamentId="event" entries={[team]} round={1} cut={noCut} /></MemoryRouter>);
    expect(view.container.querySelectorAll('[data-hybrid-board-row] [data-board-flag]')).toHaveLength(2);
  });
  it('completed low round is the lowest across all rounds, not the total', () => { const cells = hybridCompletedTiles([row('A', { round_4: -8 }), row('B', { position: 2, score: -1 })], row('A', { round_4: -8 }), { status: 'complete' }); expect(cells.find(c => c.key === 'lowRound')?.value).toBe('−8'); expect(cells.find(c => c.key === 'margin')?.value).toBe('2'); });
  it('a zero winning margin uses playoff PO', () => expect(hybridCompletedTiles([row('A'), row('B')], row('A'), { status: 'complete' }).find(c => c.key === 'margin')?.value).toBe('PO'));
  it('final weekday comes from the event end date, not a fixed Sunday', () => expect(hybridFinalWeekday('2026-11-28')).toBe('Saturday'));
});
describe('Brief 48B upcoming priority', () => {
  const args = { field: 20, purse: 1000000, wonAt: -17, par: 72, yards: 7449, par5s: 4 };
  it('uses field, purse and last winning score first', () => expect(hybridUpcomingTiles(args).map(c => c.key)).toEqual(['field', 'purse', 'wonAt']));
  it('missing primary values fill from par then yards then par fives', () => expect(hybridUpcomingTiles({ ...args, field: 0, purse: null, wonAt: null }).map(c => c.key)).toEqual(['par', 'yards', 'par5s']));
  it('no available facts produce no tiles', () => expect(hybridUpcomingTiles({ field: 0, purse: null, wonAt: null, par: null, yards: null, par5s: null })).toEqual([]));
});
describe('Overview glass-card identities and pick statuses', () => {
  it('a confirmed stroke champion has one face and a to-par figure', () => { const c = overviewStrokeCard(tm, rows, true, 2); expect(c?.champion).toBe(true); expect(c?.figure).toBe('−3'); expect(c?.faces).toHaveLength(1); });
  it('tied live leaders retain the true count and two faces', () => { const c = overviewStrokeCard(tm, [row('A'), row('B')], false, 2); expect(c?.faces).toHaveLength(2); expect(c?.champion).toBeUndefined(); });
  it('no resolvable champion never invents a champion face', () => { const c = overviewStrokeCard({ ...tm, winnerId: null }, rows, true, 2); expect(c?.faces).toBeUndefined(); expect(c?.champion).toBeUndefined(); });
  it('skins champion retains a skins figure, never gross strokes', () => { const r = skinsFromScorecards([{ id: 'A', name: 'Alex A', holes: [{ hole_number: 1, strokes: 3 }] }, { id: 'B', name: 'Alex B', holes: [{ hole_number: 1, strokes: 4 }] }], { finished: true, championId: 'A' }); const c = overviewSkinsCard(r, rows, 'pga', true, 'sr:A'); expect(c.figure).toBe(1); expect(c.champion).toBe(true); });
  it('glass faces are capped at three', () => { const { container } = render(<HybridGlassCard card={{ label: '', name: '', faces: Array.from({ length: 4 }, (_, i) => ({ key: String(i), name: String(i), candidates: [] })) }} />); expect(container.querySelectorAll('[data-face]')).toHaveLength(3); });
  it('finished pick uses actual round strokes and F', () => expect(hybridPickStatus(row('A'), 2, null, 'UTC', 72)).toBe('70 today · F'));
  it('on-course pick status uses its thru value', () => expect(hybridPickStatus(row('A', { thru: 12 }), 2, null, 'UTC', 72)).toBe('Thru 12'));
  it('not-started pick uses the existing event-zone tee', () => expect(hybridPickStatus(undefined, 2, '2026-11-28T07:30:00Z', 'UTC', 72)).toBe('Sat 07:30'));
  it('withdrawn pick cannot show a tee or strokes', () => expect(hybridPickStatus(row('A', { status: 'WD' }), 2, '2026-11-28T07:30:00Z', 'UTC', 72)).toBe('WD'));
});
describe('Brief 48C lists and common switcher', () => {
  const data: SeasonRecapData = { events: 39, winners: 31, maxWins: 5, mostWinsSurname: 'A', tiedLeaders: 1, standingsSource: null, standings: Array.from({ length: 7 }, (_, i) => ({ position: i + 1, name: `Player ${i}`, points: 4806 - i * 100, playerId: null })), cardLine: { label: 'Cards', n: 14 }, cardEarners: Array.from({ length: 14 }, (_, i) => ({ name: `Player ${i}`, initialName: `P. ${i}`, playerId: null, age: 25 })) };
  it('recap points list takes five rows when available', () => { const { container } = render(<MemoryRouter><HybridRecapStandings tour="pga" data={data} /></MemoryRouter>); expect(container.querySelectorAll('[data-recap-row]')).toHaveLength(5); expect(container.querySelectorAll('[data-recap-trophy]')).toHaveLength(1); });
  it('card list takes twelve earners, keeping the source order', () => { const { container } = render(<MemoryRouter><HybridRecapCards tour="pga" data={data} /></MemoryRouter>); expect([...container.querySelectorAll('[data-recap-card]')].map(e => e.getAttribute('data-recap-card'))).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1))); });
  it('switcher keeps exactly five segments and dispatches the canonical tour id', () => { const select = vi.fn(); const { container } = render(<OverviewTourSwitcher selectedTour="euro" onSelect={select} />); const buttons = [...container.querySelectorAll('button')]; expect(buttons).toHaveLength(5); expect(buttons.map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true', 'false', 'false']); fireEvent.click(buttons[4]); expect(select).toHaveBeenCalledWith('pgad'); });
});