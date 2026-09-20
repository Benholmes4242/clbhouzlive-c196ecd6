import { describe, expect, it } from 'vitest';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
import { selectTournamentContest } from '@/features/tourhub/tournament-v2/data/tournamentContest';

const meta = { current_round: 4 } as TournamentMeta;
const row = (id: string, score: number, position: number, today = -1, thru = 12): BoardEntry => ({ id, score, position, today, thru, player: { id, full_name: id } });

describe('selectTournamentContest', () => {
  it('derives a single lead, margin, pack and non-leader move', () => {
    const result = selectTournamentContest([row('leader', -12, 1, -2), row('second', -11, 2, -6), row('third', -9, 3)], meta, 'live');
    expect(result.margin).toBe(1);
    expect(result.withinFour).toBe(3);
    expect(result.holesLeft).toBe(6);
    expect(result.mover?.id).toBe('second');
    expect(result.leadForm).toBe('figure');
  });

  it('uses word form for a shared lead and keeps an all-level pack safe', () => {
    const board = Array.from({ length: 5 }, (_, i) => row(String(i), -10, 1, i === 0 ? -4 : -2));
    const result = selectTournamentContest(board, meta, 'live');
    expect(result.sharedLead).toBe(true);
    expect(result.pack.every((p) => p.gap === 0)).toBe(true);
    expect(result.leadForm).toBe('word');
  });

  it('hides the move when the best round belongs to a leader', () => {
    const result = selectTournamentContest([row('leader', -12, 1, -7), row('second', -10, 2, -4)], meta, 'live');
    expect(result.mover).toBeNull();
  });

  it('requires six holes and an under-par round for a live move', () => {
    const result = selectTournamentContest([row('leader', -12, 1, -1), row('fast', -10, 2, -5, 3), row('level', -9, 3, 0, 12)], meta, 'live');
    expect(result.mover).toBeNull();
  });

  it('uses word form for a completed playoff', () => {
    const result = selectTournamentContest([row('winner', -12, 1, -4, 18), row('runner', -12, 2, -3, 18)], meta, 'completed');
    expect(result.margin).toBeNull();
    expect(result.leadForm).toBe('word');
  });
});
