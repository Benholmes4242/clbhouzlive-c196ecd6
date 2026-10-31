import { describe, expect, it } from 'vitest';
import { allLeaders, leadersBaseRound, leadersShownRound, pickLeadersGroup, groupState } from '@/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupRules';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const finished: BoardEntry = { id: 'novak-row', player: { id: 'novak', full_name: 'Andrew Novak' }, position: 1, score: -14, round_1: -4, round_2: -10, today: -10, today_round: 2, thru: 18 };
const placeholder = (id: string, name: string): BoardEntry => ({ id: `${id}-row`, player: { id, full_name: name }, score: 0, position: null, thru: null, status: null, today: null, today_round: null, round_1: null, round_2: null, round_3: null, round_4: null });
const baddeley = placeholder('baddeley', 'Aaron Baddeley');
const moore = placeholder('moore', 'Taylor Moore');
const draw = (ids: string[], teeTime = '2026-10-30T19:24:00Z'): TeeGroup => ({ teeTime, startingHole: 1, players: ids.map(id => ({ id, name: id })) });
const baseDraw = [draw(['novak'])];
const shown = (entries: BoardEntry[], groups = baseDraw) => leadersShownRound(2, groups, allLeaders(entries), entries, [1, 2, 3], 4);

describe('Tour 4(a) draw-preserving completion evidence', () => {
  it('Saturday Baddeley and Moore zero-only placeholders do not block the Round 3 pre-tee group', () => {
    const entries = [finished, baddeley, moore];
    const snapshot = structuredClone(entries);
    expect(leadersBaseRound(allLeaders(entries), 3)).toBe(2);
    expect(shown(entries)).toBe(3);
    const nextDraw = [draw(['novak'], '2026-10-31T17:51:00Z')];
    const selected = pickLeadersGroup(nextDraw, allLeaders(entries), entries, 3);
    expect(selected).toBe(nextDraw[0]);
    if (!selected) throw new Error('Expected the published Round 3 group');
    expect(groupState(selected, entries, 3)).toBe('before');
    expect(entries).toEqual(snapshot);
  });
  it('preserves an evidence-free real draw player as a handover blocker', () => {
    expect(shown([finished, baddeley, moore], [draw(['novak', 'baddeley', 'moore'])])).toBe(2);
  });
  it('preserves a real draw player without any leaderboard row', () => {
    expect(shown([finished], [draw(['novak', 'missing'])])).toBe(2);
  });
  it.each([
    ['zero round card', { round_1: 0 }],
    ['position', { position: 42 }],
    ['zero thru value', { thru: 0 }],
    ['positive thru value', { thru: 1 }],
  ] as const)('leaderboard-only %s evidence joins the completion check even without a total score', (_name, evidence) => {
    const participant = { ...baddeley, score: null, ...evidence };
    expect(shown([finished, participant])).toBe(2);
    expect(shown([finished, { ...participant, round_2: 0, today: 0, today_round: 2, thru: 18 }])).toBe(3);
  });
  it.each(['CUT', 'MC', 'WD', 'DQ', 'MDF', 'DNS'])('canonical terminal %s retains the existing exemption without inventing status', status => {
    const participant = { ...baddeley, status };
    expect(shown([finished, participant], [draw(['novak', 'baddeley'])])).toBe(3);
    expect(participant.status).toBe(status);
  });
  it('COMPLETE is evidence, not an invented finished round card', () => {
    expect(shown([finished, { ...baddeley, status: 'COMPLETE' }])).toBe(2);
  });
});