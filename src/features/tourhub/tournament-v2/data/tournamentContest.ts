/** Pure contest selection for the tournament detail page. */
import type { BoardEntry } from '../../leaderboard/BoardTable';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';
import { todayFromEntry } from '../../leaderboard/BoardTable';

/** UNVERIFIED editorial threshold: within four shots is judged to be in contention. */
export const CONTENTION_GAP = 4;

export interface PackEntry {
  entry: BoardEntry;
  gap: number;
}

export interface TournamentContest {
  leaders: BoardEntry[];
  leader: BoardEntry | null;
  margin: number | null;
  sharedLead: boolean;
  chasersWithinFour: number;
  holesLeft: number | null;
  pack: PackEntry[];
  mover: BoardEntry | null;
  moverToday: number | null;
  leadForm: 'figure' | 'word' | null;
}

function byPosition(a: BoardEntry, b: BoardEntry): number {
  return (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);
}

export function selectTournamentContest(
  board: BoardEntry[],
  meta: TournamentMeta,
  state: EventState,
): TournamentContest {
  const scored = board.filter((row) => row.score != null).sort((a, b) => (a.score as number) - (b.score as number) || byPosition(a, b));
  const bestScore = scored[0]?.score ?? null;
  const leaders = bestScore == null ? [] : scored.filter((row) => row.score === bestScore);
  const leader = leaders[0] ?? null;
  const nextScore = bestScore == null ? null : scored.find((row) => (row.score as number) > bestScore)?.score ?? null;
  const sharedLead = leaders.length > 1;
  const margin = sharedLead && state === 'completed'
    ? 0
    : bestScore == null || nextScore == null
      ? null
      : Math.max(0, nextScore - bestScore);
  const chasersWithinFour = bestScore == null
    ? 0
    : scored.filter((row) =>
        !leaders.some((leaderRow) => leaderRow.id === row.id) &&
        (row.score as number) - bestScore <= CONTENTION_GAP
      ).length;
  const holesLeft = leader?.thru == null ? null : Math.max(0, 18 - leader.thru);
  const pack = bestScore == null
    ? []
    : [...scored].sort(byPosition).slice(0, 10).map((entry) => ({ entry, gap: Math.max(0, (entry.score as number) - bestScore) }));

  const eligible = board
    .map((entry) => ({ entry, today: todayFromEntry(entry, meta.current_round) }))
    .filter(({ entry, today }) => {
      if (today == null || today >= 0) return false;
      if (state === 'live') return entry.thru != null && entry.thru >= 6;
      if (state === 'completed') return entry.thru != null && entry.thru >= 18;
      return false;
    })
    .sort((a, b) => (a.today as number) - (b.today as number) || byPosition(a.entry, b.entry));
  const selectedMover = eligible[0] ?? null;
  const moverIsLeader = selectedMover != null && leaders.some((row) => row.id === selectedMover.entry.id);
  const mover = moverIsLeader ? null : selectedMover?.entry ?? null;
  const moverToday = mover ? selectedMover?.today ?? null : null;

  const leadForm = state === 'upcoming' || !leader
    ? null
    : sharedLead || (state === 'completed' && margin === 0)
      ? 'word'
      : margin != null
        ? 'figure'
        : null;

  return { leaders, leader, margin, sharedLead, chasersWithinFour, holesLeft, pack, mover, moverToday, leadForm };
}
