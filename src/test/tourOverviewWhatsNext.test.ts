import { describe, expect, it } from 'vitest';
import { roundsFromSchedule } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
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
    expect(hasNextRound(2, 4)).toBe(true);
    expect(hasNextRound(4, 4)).toBe(false);
    expect(hasNextRound(2, 3)).toBe(true);
    expect(hasNextRound(3, 3)).toBe(false);
    expect(hasNextRound(null, 4)).toBe(false);
  });
  it('needs the next round in the draw', () => {
    expect(nextDrawnRound(2, [1, 2, 3], 4)).toBe(3);
    expect(nextDrawnRound(2, [1, 2], 4)).toBeNull();
    expect(nextDrawnRound(4, [1, 2, 3, 4], 4)).toBeNull();
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

describe('required round window (Phase 4.6)', () => {
  it('four-round event: open in round three only', () => {
    expect(inRequiredRoundWindow(3, 4)).toBe(true);
    expect(inRequiredRoundWindow(2, 4)).toBe(false);
    expect(inRequiredRoundWindow(4, 4)).toBe(false);
    expect(inRequiredRoundWindow(null, 4)).toBe(false);
  });
  it('three-round event: open in round two only', () => {
    expect(inRequiredRoundWindow(2, 3)).toBe(true);
    expect(inRequiredRoundWindow(1, 3)).toBe(false);
    expect(inRequiredRoundWindow(3, 3)).toBe(false);
  });
  it('a span outside the guard falls back to four and behaves like four rounds', () => {
    const n = roundsFromSchedule('2026-10-05', '2026-10-10');
    expect(n).toBe(4);
    expect(inRequiredRoundWindow(3, n)).toBe(true);
    expect(inRequiredRoundWindow(2, n)).toBe(false);
  });
});

describe('round count from the schedule', () => {
  it('Thu–Sun is four, Fri–Sun is three', () => {
    expect(roundsFromSchedule('2026-10-08', '2026-10-11')).toBe(4);
    expect(roundsFromSchedule('2026-10-09', '2026-10-11')).toBe(3);
  });
  it('one-day and six-day spans fall back to four', () => {
    expect(roundsFromSchedule('2026-10-11', '2026-10-11')).toBe(4);
    expect(roundsFromSchedule('2026-10-06', '2026-10-11')).toBe(4);
  });
  it('an LPGA major (2026 Chevron, Apr 23–26) is four rounds', () => {
    expect(roundsFromSchedule('2026-04-23', '2026-04-26')).toBe(4);
  });
});
