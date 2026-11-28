import { describe, expect, it } from 'vitest';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { hybridBoardRounds, hybridRoundValue } from '@/features/tourhub/components/overview-v3/hybridOverviewRules';

// Provider-shaped round values: TODAY belongs to R3, but all stored rounds exist.
const entry: BoardEntry = { id: 'australian-pga-row', position: 1, score: -12, today: -5, today_round: 3, thru: 18, round_1: -4, round_2: -3, round_3: -5, round_4: -2, player: { id: 'player', full_name: 'Test Player' } };
describe('Brief 48D overview round authority', () => {
  it.each([[1, []], [3, [3]], [4, [4]]] as const)('live R%i contains no previous round', (round, expected) => {
    expect(hybridBoardRounds(round, false)).toEqual(expected);
  });
  it('between rounds after R3 reads the completed R3 value', () => {
    expect(hybridBoardRounds(3, false).map(round => hybridRoundValue(entry, round))).toEqual([-5]);
  });
  it('R2 remains available when TODAY belongs to R3', () => {
    expect(hybridRoundValue(entry, 2)).toBe(-3);
  });
  it('final R1–R4 all read their own stored values despite TODAY round mismatch', () => {
    expect(hybridBoardRounds(4, true).map(round => hybridRoundValue(entry, round))).toEqual([-4, -3, -5, -2]);
  });
  it('a stored zero is preserved ahead of a different TODAY value', () => {
    expect(hybridRoundValue({ ...entry, round_3: 0 }, 3)).toBe(0);
  });
  it('missing stored current round may use matching TODAY, never another round', () => {
    expect(hybridRoundValue({ ...entry, round_3: null }, 3)).toBe(-5);
    expect(hybridRoundValue({ ...entry, round_2: null }, 2)).toBeNull();
  });
});
