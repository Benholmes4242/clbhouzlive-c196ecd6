/** Pure contest selection for the tournament detail page. */
import type { BoardEntry } from '../../leaderboard/BoardTable';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { hasStrokeBoard } from '../../_shared/eventFormat';

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
  /** A completed event with a shared top score is a playoff. It is decided
   * when the tournament winner resolves to one of those tied leaders. */
  playoffDecided: boolean;
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
  // Stroke and team rows share lower-is-better to-par grammar. Cups hold match
  // points and match play has no scores, so neither may enter this selection.
  if (!hasStrokeBoard(meta.event_type)) {
    return {
      leaders: [], leader: null, margin: null, sharedLead: false, playoffDecided: false,
      chasersWithinFour: 0, holesLeft: null, pack: [], mover: null, moverToday: null, leadForm: null,
    };
  }
  const scored = board.filter((row) => row.score != null).sort((a, b) => (a.score as number) - (b.score as number) || byPosition(a, b));
  const bestScore = scored[0]?.score ?? null;
  const leaders = bestScore == null ? [] : scored.filter((row) => row.score === bestScore);
  const nextScore = bestScore == null ? null : scored.find((row) => (row.score as number) > bestScore)?.score ?? null;
  const sharedLead = leaders.length > 1;
  // A completed event with a shared top score was decided in a playoff. The
  // board cannot tell us who won it — every participant is legitimately T1 —
  // so the winner comes from sr_tournaments.winner_id, which stores sr_id.
  const winnerEntry = state === 'completed' && sharedLead && meta.winner_id
    ? leaders.find((row) => row.player?.sr_id === meta.winner_id) ?? null
    : null;
  const playoffDecided = winnerEntry != null;
  const orderedLeaders = winnerEntry
    ? [winnerEntry, ...leaders.filter((row) => row.id !== winnerEntry.id)]
    : leaders;
  const leader = orderedLeaders[0] ?? null;
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
  // Holes remaining is a live-only fact: on a finished event `thru` is stale
  // feed residue and 18 - thru is meaningless.
  const holesLeft = state === 'live' && leader?.thru != null ? Math.max(0, 18 - leader.thru) : null;
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

  return { leaders: orderedLeaders, leader, margin, sharedLead, playoffDecided, chasersWithinFour, holesLeft, pack, mover, moverToday, leadForm };
}
