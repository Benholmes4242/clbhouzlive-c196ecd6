import { describe, expect, it } from 'vitest';
import {
  MIN_TARGET_ROUND,
  inRequiredRoundWindow,
  hasNextRound,
  leaderGroup,
  leaderOf,
  neededGross,
  nextDrawnRound,
} from '@/features/tourhub/components/overview-v3/HybridHeroBands/whatsNext';

describe('required round (Phase 4.1)', () => {
  it('is par plus the gap: −9 vs leader −13 at par 70 needs 66', () => {
    expect(neededGross(70, -13, -9)).toBe(66);
  });
  it('gives nothing to the leader or a pick level with them', () => {
    expect(neededGross(70, -13, -13)).toBeNull();
    expect(neededGross(70, -13, -14)).toBeNull();
  });
  it('renders nothing below 59, but 59 itself survives', () => {
    expect(MIN_TARGET_ROUND).toBe(59);
    expect(neededGross(70, -13, -2)).toBe(59);
    expect(neededGross(70, -13, -1)).toBeNull();
  });
  it('renders nothing when par or a total is missing', () => {
    expect(neededGross(null, -13, -9)).toBeNull();
    expect(neededGross(70, null, -9)).toBeNull();
    expect(neededGross(70, -13, null)).toBeNull();
  });
});

describe('next round band (Phase 4.2)', () => {
  it('only exists before the final round', () => {
    expect(hasNextRound(2)).toBe(true);
    expect(hasNextRound(4)).toBe(false);
    expect(hasNextRound(null)).toBe(false);
  });
  it('needs the next round in the draw', () => {
    expect(nextDrawnRound(2, [1, 2, 3])).toBe(3);
    expect(nextDrawnRound(2, [1, 2])).toBeNull();
    expect(nextDrawnRound(4, [1, 2, 3, 4])).toBeNull();
  });
  it('finds the leader’s group by player id, not the last group off', () => {
    const groups = [
      { teeTime: '2026-10-10T12:00:00Z', startingHole: 1, players: [{ id: 'a', name: 'A' }, { id: 'lead', name: 'Lead' }] },
      { teeTime: '2026-10-10T13:00:00Z', startingHole: 10, players: [{ id: 'b', name: 'B' }] },
    ];
    expect(leaderGroup(groups, 'lead')?.teeTime).toBe('2026-10-10T12:00:00Z');
    expect(leaderGroup(groups, 'zzz')).toBeNull();
    expect(leaderOf([{ position: 2, score: -5, player: { id: 'x' } }, { position: 1, score: -9, player: { id: 'lead' } }]))
      .toEqual({ playerId: 'lead', total: -9 });
  });
});

describe('required round window (Phase 4.5)', () => {
  it('is the penultimate round only', () => {
    expect(inRequiredRoundWindow(3)).toBe(true);
    expect(inRequiredRoundWindow(2)).toBe(false);
    expect(inRequiredRoundWindow(4)).toBe(false);
    expect(inRequiredRoundWindow(null)).toBe(false);
  });
});
