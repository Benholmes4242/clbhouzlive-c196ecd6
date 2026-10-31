import { describe, expect, it } from 'vitest';
import { allLeaders, leadersBaseRound, leadersShownRound, pickLeadersGroup, groupState } from '@/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupRules';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const finished: BoardEntry = { id: 'novak-row', player: { id: 'novak', full_name: 'Andrew Novak' }, position: 1, score: -14, round_1: -4, round_2: -10, today: -10, today_round: 2, thru: 18 };
const placeholder = (id: string): BoardEntry => ({ id: `${id}-row`, player: { id, full_name: id }, score: 0, position: null, thru: null, status: null, today: null, today_round: null, round_1: null, round_2: null, round_3: null, round_4: null });
const baddeley = placeholder('Aaron Baddeley'), moore = placeholder('Taylor Moore');
const draw = (ids: string[], teeTime = '2026-10-30T19:24:00Z'): TeeGroup => ({ teeTime, startingHole: 1, players: ids.map(id => ({ id, name: id })) });
const baseDraw = [draw(['novak'])], nextDraw = [draw(['novak'], '2026-10-31T17:51:00Z')];
const shown = (entries: BoardEntry[], groups = baseDraw, next = nextDraw, rounds = [1, 2, 3]) => leadersShownRound(2, groups, allLeaders(entries), entries, rounds, 4, next);

describe('Tour 4(a) revised leaders-only handover', () => {
  it('a tied leader outside the selected finished group blocks until that leader completes round N', () => {
    const second = { ...finished, id: 'second-row', player: { id: 'second', full_name: 'Second leader' } };
    const playing = { ...finished, id: 'third-row', player: { id: 'third', full_name: 'Third leader' }, round_2: null, thru: 12 };
    const groups = [draw(['novak', 'second']), draw(['third'])];
    expect(shown([finished, second, playing], groups)).toBe(2);
    expect(shown([finished, second, { ...playing, thru: 18 }], groups)).toBe(3);
  });
  it('Saturday finished R2 leaders hand over to the published R3 group despite Baddeley and Moore in other real draw groups', () => {
    const entries = [finished, baddeley, moore];
    const groups = [...baseDraw, draw(['Aaron Baddeley', 'Taylor Moore'])];
    const snapshot = structuredClone({ entries, groups });
    expect(leadersBaseRound(allLeaders(entries), 3)).toBe(2);
    expect(shown(entries, groups)).toBe(3);
    const selected = pickLeadersGroup(nextDraw, allLeaders(entries), entries, 3);
    expect(selected).toBe(nextDraw[0]);
    if (!selected) throw new Error('Expected the published Round 3 group');
    expect(groupState(selected, entries, 3)).toBe('before');
    expect({ entries, groups }).toEqual(snapshot);
  });
  it('Friday finished R2 group stays Finished before the R3 draw exists', () => {
    expect(shown([finished], baseDraw, [], [1, 2])).toBe(2);
    expect(groupState(baseDraw[0], [finished], 2)).toBe('finished');
  });
  it('early PGA R2 draw never advances an unfinished R1 leaders group', () => {
    const playing = { ...finished, round_1: null, round_2: null, today_round: 1, today: -2, thru: 12 };
    expect(leadersShownRound(1, baseDraw, allLeaders([playing]), [playing], [1, 2], 4, nextDraw)).toBe(1);
  });
  it('leader still on course in R2 prevents handover despite a published R3 draw', () => {
    expect(shown([{ ...finished, round_2: null, thru: 12 }])).toBe(2);
  });
  it.each(['MC', 'CUT', 'WD', 'DQ'])('a %s inside the leaders group counts as complete', status => {
    const member = { ...baddeley, status };
    expect(shown([finished, member], [draw(['novak', 'Aaron Baddeley'])])).toBe(3);
    expect(member.status).toBe(status);
  });
  it('a zero-valued round N card completes the group even with a stale partial thru', () => {
    expect(shown([{ ...finished, round_2: 0, today: 0, thru: 3 }])).toBe(3);
  });
  it('round-scoped thru 18 completes the group without a round card', () => {
    expect(shown([{ ...finished, round_2: null, thru: 18 }])).toBe(3);
  });
  it('stale earlier-round thru 18 never completes the base round', () => {
    expect(shown([{ ...finished, round_2: null, today_round: 1, thru: 18 }])).toBe(2);
  });
  it('an unknown member within the selected leaders group still blocks handover', () => {
    expect(shown([finished], [draw(['novak', 'missing'])])).toBe(2);
  });
  it('next draw without a current position-1 leader does not advance', () => {
    expect(shown([finished], baseDraw, [draw(['other'])])).toBe(2);
  });
  it('never skips an unpublished N+1 round to a later draw', () => {
    expect(shown([finished], baseDraw, nextDraw, [1, 2, 4])).toBe(2);
  });
});
