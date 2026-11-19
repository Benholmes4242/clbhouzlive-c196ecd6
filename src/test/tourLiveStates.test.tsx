/** TOUR OVERVIEW LIVE STATE REDESIGN — rules and live-only presentation. */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }), Trans: () => null }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({}), rpc: () => Promise.resolve({ data: null, error: null }) } }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));

import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import {
  betweenRounds, liveStage, liveFactCells, leadCell, formatHoleAvg, holeAverages, holeAvgColor, initialSurname, livePicksHeading,
  HOLE_AVG_UNDER, HOLE_AVG_OVER, HOLE_AVG_HARD,
} from '@/features/tourhub/components/overview-v3/liveStateRules';
import { LiveHeroBoard, liveBoardLayout, liveBoardGrid } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard';
import { livePickRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock';
import { RoundSpine } from '@/features/tourhub/components/overview-v3/HybridHeroBands/RoundSpine';
import { heroStateLine } from '@/features/tourhub/components/overview-v3/HybridHeroBands/heroStateLine';
import { UpcomingCourse } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { heroBoardColumns } from '@/features/tourhub/tournament-v2/sections/HeroBoardRows';

let n = 0;
const e = (o: Partial<BoardEntry>): BoardEntry => ({ id: `e${++n}`, position: 1, score: 0, player: { id: `p${n}`, full_name: `Player ${n}` }, ...o });
const echo = (k: string, o?: Record<string, unknown>) => `${k}${o ? JSON.stringify(o) : ''}`;
const NO_CUT = { status: 'inprogress', currentRound: 1, cutRound: null, cutline: null, projectedCutline: null };

describe('betweenRounds', () => {
  it('(a) current_round advanced with an empty column returns the finished round', () => {
    const rows = [e({ round_1: -7, round_2: null, thru: 18 }), e({ round_1: -2, thru: 18 })];
    expect(betweenRounds(rows, 2)).toBe(1);
  });
  it('(b) current_round not advanced, every active player through 18 returns that round', () => {
    const rows = [e({ round_1: -7, thru: 18 }), e({ round_1: 1, thru: 18 }), e({ round_1: 3, thru: 9, status: 'WD' })];
    expect(betweenRounds(rows, 1, 'closed')).toBe(1);
  });
  it('in play (someone mid-round) and a pre-start field are not between rounds', () => {
    expect(betweenRounds([e({ round_1: -3, thru: 18 }), e({ round_1: -1, thru: 12 })], 1)).toBeNull();
    expect(betweenRounds([e({ score: 0 }), e({ score: 0 })], 1)).toBeNull();
  });
  it('a stale unlabelled today with thru 18 never reads as a finished round', () => {
    expect(betweenRounds([e({ today: -2, thru: 18, round_1: -2 }), e({ today: -1, thru: 18, round_1: -1 })], 2)).toBeNull();
  });
});

describe('liveStage — seven states', () => {
  const started = [e({ round_1: -4, thru: 10 }), e({ round_1: -1, thru: 3 })];
  it('1 before the first tee', () => expect(liveStage({ kind: 'live', round: 1, totalRounds: 4, entries: [e({}), e({})] }).stage).toBe('beforeTee'));
  it('2 round 1 in play', () => expect(liveStage({ kind: 'live', round: 1, totalRounds: 4, entries: started, cutRound: 2 }).stage).toBe('round1'));
  it('3 between rounds', () => {
    const r = liveStage({ kind: 'live', round: 2, totalRounds: 4, entries: [e({ round_1: -7, thru: 18 })], cutRound: 2 });
    expect(r).toEqual({ stage: 'between', round: 1, nextRound: 2 });
  });
  it('4 the cut round', () => expect(liveStage({ kind: 'live', round: 2, totalRounds: 4, entries: [e({ round_1: -4, round_2: -1, thru: 5 })], cutRound: 2 }).stage).toBe('cutRound'));
  it('5 after the cut', () => expect(liveStage({ kind: 'live', round: 3, totalRounds: 4, entries: [e({ round_1: -4, round_2: -1, round_3: -2, thru: 5 })], cutRound: 2 }).stage).toBe('afterCut'));
  it('6 suspended', () => expect(liveStage({ kind: 'suspended', round: 2, totalRounds: 4, entries: started }).stage).toBe('suspended'));
  it('7 final round', () => expect(liveStage({ kind: 'live', round: 4, totalRounds: 4, entries: [e({ round_1: -4, round_2: -1, round_3: -2, round_4: -1, thru: 5 })], cutRound: 2 }).stage).toBe('final'));
});

describe('live facts', () => {
  const keys = (c: ReturnType<typeof liveFactCells>) => c.map(x => x.key);
  it('before the tee: event facts', () => {
    expect(keys(liveFactCells({ stage: 'beforeTee', round: 1, entries: [e({}), e({})], par: 70, yards: 7157, purse: 7400000, cut: NO_CUT }))).toEqual(['field', 'purse', 'par', 'yards']);
  });
  it('round 1: ON COURSE · FINISHED · LOW ROUND · SCORING AVG from the board', () => {
    const rows = [e({ round_1: -7, thru: 18 }), e({ round_1: -1, thru: 18 }), e({ round_1: 2, thru: 7 })];
    const cells = liveFactCells({ stage: 'round1', round: 1, entries: rows, par: 70, cut: NO_CUT });
    expect(cells.map(c => [c.key, c.value])).toEqual([['onCourse', '1'], ['finished', '2'], ['lowRound', '\u22127'], ['scoringAvg', '66.00']]);
  });
  it('between rounds: projected cut from resolveCutDisplay; no cut drops the cell', () => {
    const rows = [e({ round_1: -7, thru: 18, score: -7 }), e({ round_1: 1, thru: 18, score: 1 })];
    const withCut = liveFactCells({ stage: 'between', round: 1, entries: rows, par: 70, cut: { status: 'inprogress', currentRound: 2, cutRound: 2, cutline: null, projectedCutline: -1 } });
    expect(keys(withCut)).toEqual(['lowRound', 'scoringAvg', 'underPar', 'projCut']);
    expect(withCut[3].value).toBe('\u22121');
    expect(keys(liveFactCells({ stage: 'between', round: 1, entries: rows, par: 70, cut: NO_CUT }))).toEqual(['lowRound', 'scoringAvg', 'underPar']);
  });
  it('after the cut: MADE CUT counts entries without MC/CUT', () => {
    const rows = [e({ round_3: -1, thru: 4 }), e({ round_3: 0, thru: 18 }), e({ status: 'MC' }), e({ status: 'CUT' })];
    const cells = liveFactCells({ stage: 'afterCut', round: 3, entries: rows, par: 70, cut: NO_CUT });
    expect(cells.find(c => c.key === 'madeCut')?.value).toBe('2');
  });
  it('suspended: TO FINISH replaces ON COURSE', () => {
    const rows = [e({ round_2: -1, thru: 18 }), e({ round_2: 0, thru: 9 }), e({})];
    expect(keys(liveFactCells({ stage: 'suspended', round: 2, entries: rows, par: 70, cut: NO_CUT }))[0]).toBe('toFinish');
    expect(liveFactCells({ stage: 'suspended', round: 2, entries: rows, par: 70, cut: NO_CUT })[0].value).toBe('2');
  });
  it('final round: LEAD is the gap; a tied lead reads TIED', () => {
    expect(leadCell([e({ score: -17 }), e({ score: -15 })])).toEqual({ key: 'lead', value: '2', toPar: null });
    expect(leadCell([e({ score: -17 }), e({ score: -17 }), e({ score: -12 })])).toEqual({ key: 'tied', value: 'T2', toPar: null });
  });
  it('a figure with no data drops its cell (no finished players: no SCORING AVG)', () => {
    const rows = [e({ round_1: -2, thru: 5 })];
    expect(keys(liveFactCells({ stage: 'round1', round: 1, entries: rows, par: 70, cut: NO_CUT }))).not.toContain('scoringAvg');
  });
});

describe('course field averages', () => {
  it('formats −.08, +.21, E and +1.02', () => {
    expect([formatHoleAvg(-0.08), formatHoleAvg(0.21), formatHoleAvg(0.001), formatHoleAvg(1.02)]).toEqual(['\u2212.08', '+.21', 'E', '+1.02']);
  });
  it('marks hardest/easiest, sums nines and hides thin holes', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, avg_to_par: i === 12 ? 0.21 : i === 14 ? -0.48 : 0.01, rounds: 50 }));
    const row = holeAverages(holes);
    expect(row.hardest).toBe(13); expect(row.easiest).toBe(15);
    expect(row.out).toBeCloseTo(0.09);
    const thin = holeAverages(holes.map(h => h.hole_no === 1 ? { ...h, rounds: 3 } : h));
    expect(thin.holes[0].text).toBe(''); expect(thin.out).toBeNull();
  });
  it('colours: under red, over/E dim, hardest ink', () => {
    expect(holeAvgColor(-0.1)).toBe(HOLE_AVG_UNDER); expect(holeAvgColor(0.1)).toBe(HOLE_AVG_OVER); expect(holeAvgColor(0.2, 'hardest')).toBe(HOLE_AVG_HARD);
  });
  it('the live scorecard gains a fourth row; upcoming stays three rows', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: 4, yards: 400 })) as never;
    const avg = holeAverages(Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, avg_to_par: 0.1, rounds: 40 })));
    const { container, unmount } = render(<MemoryRouter><UpcomingCourse holes={holes} tournamentId="t" live={{ kicker: 'K', lead: null, averages: avg, keyLine: <span>key</span> }} /></MemoryRouter>);
    expect(container.querySelectorAll('[data-hole-avg]').length).toBe(18);
    expect(container.querySelectorAll('[data-hole-avg-total]').length).toBe(2);
    expect(container.querySelector('[data-live-course-key]')).not.toBeNull();
    unmount();
    const up = render(<MemoryRouter><UpcomingCourse holes={holes} tournamentId="t" /></MemoryRouter>);
    expect(up.container.querySelectorAll('[data-hole-avg]').length).toBe(0);
  });
});

describe('live board', () => {
  it('round 1 drops TODAY; later rounds add it; between shows the next tee', () => {
    expect(liveBoardLayout('round1', 1, null)).toEqual({ today: false, nextTee: null, thruLive: true });
    expect(liveBoardLayout('cutRound', 2, null).today).toBe(true);
    expect(liveBoardLayout('between', 1, 2)).toEqual({ today: false, nextTee: 2, thruLive: false });
    expect(liveBoardLayout('suspended', 2, null).thruLive).toBe(false);
    expect(liveBoardGrid(liveBoardLayout('cutRound', 2, null)).split(' ')).toHaveLength(5);
  });
  it('renders THRU/TODAY/TOT columns and a short-name twin for narrow screens', () => {
    const rows = [e({ position: 1, score: -9, round_1: -4, round_2: -5, thru: 12, player: { id: 'mg', full_name: 'Max Greyserman' } })];
    const { container } = render(<LiveHeroBoard tournamentId="t" entries={rows} stage="cutRound" round={2} nextRound={null} />);
    expect([...container.querySelectorAll('[data-live-col]')].map(x => x.getAttribute('data-live-col'))).toEqual(['thru', 'today', 'tot']);
    expect(container.querySelector('[data-live-board]')?.hasAttribute('data-live-today')).toBe(true);
    expect(container.querySelector('[data-live-cell="thru"]')?.textContent).toBe('12');
    expect(container.querySelector('.live-board-name-short')?.textContent).toBe('M. Greyserman');
  });
  it('round 1 has no TODAY column', () => {
    const { container } = render(<LiveHeroBoard tournamentId="t" entries={[e({ round_1: -2, thru: 4 })]} stage="round1" round={1} nextRound={null} />);
    expect(container.querySelector('[data-live-col="today"]')).toBeNull();
  });
  it('initialSurname keeps particles', () => expect(initialSurname('Erik van Rooyen')).toBe('E. van Rooyen'));
});

describe('picks', () => {
  it('heading labels per state', () => {
    expect(livePicksHeading('beforeTee', 1, echo).full).toBe('overview.live.picks.teeToday');
    expect(livePicksHeading('between', 1, echo).full).toBe('overview.live.picks.teeTimes{"round":2}');
    expect(livePicksHeading('suspended', 2, echo).full).toBe('overview.live.picks.suspended{"round":2}');
    expect(livePicksHeading('final', 4, echo).full).toBe('overview.live.picks.finalLive');
    expect(livePicksHeading('cutRound', 2, echo).full).toBe('overview.live.picks.roundLive{"round":2}');
  });
  it('rows: start tee, thru/finished with total, tee time between rounds, MC', () => {
    expect(livePickRow('beforeTee', undefined, '2026-11-19T13:41:00Z', 1, 'UTC', echo)).toMatchObject({ sub: 'overview.live.tees.first', right: '13:41', rightKind: 'tee' });
    expect(livePickRow('cutRound', { position: 17, tied: true, score: -3, thru: 18, started: true }, null, null, null, echo)).toMatchObject({ sub: 'overview.live.picks.finished{"pos":"T17"}', right: '\u22123', rightKind: 'score' });
    expect(livePickRow('cutRound', { position: 35, tied: true, score: -2, thru: 12, started: true }, null, null, null, echo).sub).toBe('overview.live.picks.thru{"pos":"T35","thru":12}');
    expect(livePickRow('between', { position: 81, tied: true, score: 0, thru: 18, started: true }, '2026-11-20T14:03:00Z', null, 'UTC', echo)).toMatchObject({ sub: 'T81', subScore: 0, right: '14:03' });
    expect(livePickRow('afterCut', { position: null, tied: false, score: 2, status: 'MC' }, null, null, null, echo)).toMatchObject({ sub: 'overview.live.picks.missedCut', rightKind: 'mc' });
  });
});

describe('hero', () => {
  it('AFTER ROUND n between rounds; Round n otherwise', () => {
    expect(heroStateLine(echo as never, { kind: 'live', round: 2, totalRounds: 4, afterRound: 1 })).toBe('overview.hero.afterRound{"round":1}');
    expect(heroStateLine(echo as never, { kind: 'live', round: 2, totalRounds: 4 })).toBe('overview.hero.round{"round":2}');
  });
  it('suspended spine shows a pause mark, not the live dot', () => {
    const { container, rerender } = render(<RoundSpine round={2} totalRounds={4} suspended />);
    expect(container.querySelector('[data-round-node="paused"] [data-round-pause]')).not.toBeNull();
    expect(container.querySelector('[data-round-node="live"]')).toBeNull();
    rerender(<RoundSpine round={2} totalRounds={4} />);
    expect(container.querySelector('[data-round-node="live"]')).not.toBeNull();
  });
});

describe('frozen siblings', () => {
  it('the shared R1…Rn hero grammar (completed board, Also this week) is unchanged', () => {
    expect(heroBoardColumns({ roundCount: 2, roundInProgress: true, completed: false })).toEqual({ today: false, rounds: true, shape: false });
  });
  it('the upcoming course card keeps its default kicker path', () => {
    render(<MemoryRouter><UpcomingCourse holes={Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: 4, yards: 400 })) as never} tournamentId="t" /></MemoryRouter>);
    expect(screen.queryByText('K')).toBeNull();
  });
});
