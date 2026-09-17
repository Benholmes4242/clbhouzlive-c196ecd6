import { describe, expect, it } from 'vitest';
import { hasMovement } from '@/features/tourhub/overview/sections/WorldRankings';
import type { RankingsRow } from '@/features/tourhub/overview/data/useRankingsBoards';

function row(movement: number | null): RankingsRow {
  return {
    rank: 1,
    priorRank: null,
    playerId: 'p',
    playerName: 'Player',
    country: null,
    photoUrl: null,
    points: null,
    movement,
    wins: null,
    top10s: null,
  };
}

describe('World Rankings movement column', () => {
  it('hides the column when no drawn row carries movement', () => {
    expect(hasMovement([row(null), row(0), row(null), row(0), row(null)])).toBe(false);
  });

  it('shows the column when any drawn row carries movement', () => {
    expect(hasMovement([row(null), row(0), row(-3), row(null), row(0)])).toBe(true);
  });

  it('ignores movement outside the five drawn rows', () => {
    const drawn = [row(0), row(null), row(0), row(0), row(null)];
    expect(hasMovement(drawn)).toBe(false);
    expect(hasMovement([...drawn, row(7)].slice(0, 5))).toBe(false);
  });

  it('treats an empty board as no column', () => {
    expect(hasMovement([])).toBe(false);
  });
});
