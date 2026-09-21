import { describe, expect, it } from 'vitest';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
import { selectTournamentContest } from '@/features/tourhub/tournament-v2/data/tournamentContest';
import { resolveBoardEntity, resolveChampion, teamNamesNeedInitials } from '@/features/tourhub/_shared/boardEntity';

const meta = { current_round: 4, winner_id: null } as TournamentMeta;
const row = (id: string, score: number, position: number, today = -1, thru = 12, positionTied = false): BoardEntry => ({ id, score, position, position_tied: positionTied, today, thru, player: { id, sr_id: `sr-${id}`, full_name: id } });
const teamRow = (
  id: string,
  score: number,
  position: number,
  abbrName: string | null,
  displayName: string | null,
  members: string[],
): BoardEntry => ({
  id,
  score,
  position,
  position_tied: false,
  today: null,
  thru: 18,
  player: null,
  team: {
    id: `team-${id}`,
    abbr_name: abbrName,
    display_name: displayName,
    members: members.map((fullName, index) => ({
      position_in_team: index + 1,
      player: { id: `${id}-${index}`, full_name: fullName },
    })),
  },
});

describe('selectTournamentContest', () => {
  it('derives a single lead, margin, pack and non-leader move', () => {
    const result = selectTournamentContest([row('leader', -12, 1, -2), row('second', -11, 2, -6), row('third', -9, 3)], meta, 'live');
    expect(result.margin).toBe(1);
    expect(result.chasersWithinFour).toBe(2);
    expect(result.holesLeft).toBe(6);
    expect(result.mover?.id).toBe('second');
    expect(result.leadForm).toBe('figure');
  });

  it('uses word form for a shared lead and keeps an all-level pack safe', () => {
    const board = Array.from({ length: 5 }, (_, i) => row(String(i), -10, 1, i === 0 ? -4 : -2));
    const result = selectTournamentContest(board, meta, 'live');
    expect(result.sharedLead).toBe(true);
    expect(result.chasersWithinFour).toBe(0);
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
    const result = selectTournamentContest([row('runner', -12, 1, -3, 18, true), row('winner', -12, 1, -4, 18, true)], { ...meta, winner_id: 'sr-winner' }, 'completed');
    expect(result.margin).toBe(0);
    expect(result.leadForm).toBe('word');
    expect(result.playoffDecided).toBe(true);
    expect(result.leader?.id).toBe('winner');
    expect(result.leaders.map((entry) => entry.id)).toEqual(['winner', 'runner']);
    expect(result.holesLeft).toBeNull();
  });

  it('asserts no leader on a cup: score holds match points, so min(score) is the losing side', () => {
    const cupMeta = { ...meta, event_type: 'cup' } as TournamentMeta;
    const board = [
      { id: 'usa', score: 15, position: null, position_tied: false, today: null, thru: null, player: null },
      { id: 'int', score: 13, position: null, position_tied: false, today: null, thru: null, player: null },
    ] as unknown as BoardEntry[];
    const result = selectTournamentContest(board, cupMeta, 'completed');
    expect(result.leader).toBeNull();
    expect(result.leaders).toEqual([]);
    expect(result.margin).toBeNull();
    expect(result.pack).toEqual([]);
    expect(result.leadForm).toBeNull();
  });

  it('keeps a completed tied leader on the finished-level path', () => {
    const result = selectTournamentContest([row('a', -12, 1, -4, 13, true), row('b', -12, 1, -3, 13, true)], meta, 'completed');
    expect(result.playoffDecided).toBe(false);
    expect(result.holesLeft).toBeNull();
    expect(result.leadForm).toBe('word');
  });

  it('keeps the completed non-playoff margin in figure form', () => {
    const result = selectTournamentContest([row('winner', -12, 1, -4, 18), row('runner', -10, 2, -3, 18)], meta, 'completed');
    expect(result.margin).toBe(2);
    expect(result.playoffDecided).toBe(false);
    expect(result.leadForm).toBe('figure');
  });

  it('selects a team-event leader using stroke-board scoring', () => {
    const board = [
      teamRow('leaders', -18, 1, 'Smalley / Springer', 'A.Smalley/H.Springer', ['Alex Smalley', 'Hayden Springer']),
      teamRow('chasers', -16, 2, 'Cantlay / Schauffele', 'P.Cantlay/X.Schauffele', ['Patrick Cantlay', 'Xander Schauffele']),
    ];
    const result = selectTournamentContest(board, { ...meta, event_type: 'team' } as TournamentMeta, 'completed');
    expect(result.leader?.id).toBe('leaders');
    expect(result.margin).toBe(2);
    expect(result.mover).toBeNull();
  });

  it('uses provider initials for every team when any surname is ambiguous and keeps full prose', () => {
    const board = [
      teamRow('kim-wilson', -18, 1, 'Kim / Wilson', 'G.Kim/Y.Wilson', ['Gina Kim', 'Yana Wilson']),
      teamRow('kim-choi', -17, 2, 'Kim / Choi', 'H.J.Kim/H.J.Choi', ['Hyo Joo Kim', 'Hye Jin Choi']),
      teamRow('iwai', -16, 3, 'Iwai / Iwai', 'A.Iwai/C.Iwai', ['Akie Iwai', 'Chisato Iwai']),
      teamRow('smalley-springer', -15, 4, 'Smalley / Springer', 'A.Smalley/B.Springer', ['Alex Smalley', 'Ben Springer']),
    ];
    const needsInitials = teamNamesNeedInitials(board);

    expect(needsInitials).toBe(true);
    expect(resolveBoardEntity(board[0], needsInitials)).toEqual({ kind: 'team', lines: ['G. Kim', 'Y. Wilson'], prose: 'Gina Kim and Yana Wilson' });
    expect(resolveBoardEntity(board[1], needsInitials).lines).toEqual(['H. J. Kim', 'H. J. Choi']);
    expect(resolveBoardEntity(board[2], needsInitials).lines).toEqual(['A. Iwai', 'C. Iwai']);
    expect(resolveBoardEntity(board[3], needsInitials).lines).toEqual(['A. Smalley', 'B. Springer']);
    expect(resolveBoardEntity(board[0], needsInitials, 'surname').lines).toEqual(['G. Kim', 'Y. Wilson']);
    expect(resolveBoardEntity(board[0], needsInitials, 'full').lines).toEqual(['Gina Kim', 'Yana Wilson']);
  });

  it('uses surname forms for every team when the board has no ambiguous surname', () => {
    const board = [
      teamRow('smalley-springer', -18, 1, 'Smalley / Springer', 'A.Smalley/B.Springer', ['Alex Smalley', 'Ben Springer']),
      teamRow('cantlay-schauffele', -17, 2, 'Cantlay / Schauffele', 'P.Cantlay/X.Schauffele', ['Patrick Cantlay', 'Xander Schauffele']),
    ];
    const needsInitials = teamNamesNeedInitials(board);

    expect(needsInitials).toBe(false);
    expect(resolveBoardEntity(board[0], needsInitials).lines).toEqual(['Smalley', 'Springer']);
    expect(resolveBoardEntity(board[1], needsInitials).lines).toEqual(['Cantlay', 'Schauffele']);
  });

  it('uses the honest team-name fallback order without null text', () => {
    const displayOnly = teamRow('display', -1, 1, null, 'A.Smith/B.Jones', []);
    const empty = teamRow('empty', 0, 2, null, null, []);
    expect(resolveBoardEntity(displayOnly, false).lines).toEqual(['A. Smith', 'B. Jones']);
    expect(resolveBoardEntity(empty, false)).toEqual({ kind: 'team', lines: ['', ''], prose: '' });
  });

  it('resolves a team champion only from one untied position-1 team row', () => {
    const board = [
      teamRow('zurich-winners', -27, 1, 'Smalley / Springer', 'A.Smalley/H.Springer', ['Alex Smalley', 'Hayden Springer']),
      teamRow('zurich-runners', -25, 2, 'Hardy / Riley', 'N.Hardy/D.Riley', ['Nick Hardy', 'Davis Riley']),
    ];
    expect(resolveChampion(board, { ...meta, event_type: 'team' })?.prose).toBe('Alex Smalley and Hayden Springer');
  });

  it('names nobody for a tied team top', () => {
    const tiedWinner = teamRow('a', -20, 1, 'Kim / Wilson', 'G.Kim/Y.Wilson', ['Gina Kim', 'Yana Wilson']);
    const tiedOther = teamRow('b', -20, 1, 'Kim / Choi', 'H.J.Kim/H.J.Choi', ['Hyo Joo Kim', 'Hye Jin Choi']);
    tiedWinner.position_tied = true;
    tiedOther.position_tied = true;
    expect(resolveChampion([tiedWinner, tiedOther], { ...meta, event_type: 'team' })).toBeNull();
  });
});
