/** Board-only presentation rules. Hero scoring and geometry remain independent. */
import type { BoardEntry } from './BoardTable';
import { isDemotedStatus } from '../_shared/resultStatus';
import { surnameOf } from '../_shared/playerName';
import { fmtScore } from '../utils/fmtScore';

export const FIELD_GATE = 20;
export function fieldAverageToday(entries: BoardEntry[], round?: number | null) {
  if (round == null || round < 1 || round > 4) return null;
  const finished = entries.filter(e => [e.round_1,e.round_2,e.round_3,e.round_4][round-1] != null && (e.thru == null || e.thru >= 18));
  if (finished.length < FIELD_GATE) return null;
  const values = finished.map(e => [e.round_1,e.round_2,e.round_3,e.round_4][round-1] ?? 0);
  const low = Math.min(...values);
  const lowPlayers = finished.filter((_,i) => values[i] === low);
  return { avg: values.reduce((a,b) => a+b,0)/values.length, count: values.length, low, lowPlayers };
}
/**
 * LOW TODAY / LOW ROUND — the lowest score in the given round among players
 * who have started it. NOT gated: it is one score, not an average, so the
 * twenty-round FIELD_GATE does not apply. The round value is read inline
 * (today honoured when it is the asked round) to keep this module free of
 * the BoardTable import cycle.
 */
export function lowRoundScore(entries: BoardEntry[], round?: number | null) {
  if (round == null || round < 1 || round > 4) return null;
  const roundValue = (e: BoardEntry): number | null => {
    const byRound = [e.round_1, e.round_2, e.round_3, e.round_4][round - 1];
    if (byRound != null) return byRound;
    if (e.today != null && (e.today_round == null || e.today_round === round)) return e.today;
    return null;
  };
  const started = entries.filter((e) => roundValue(e) != null && !isDemotedStatus(e.status));
  if (started.length === 0) return null;
  const values = started.map((e) => roundValue(e) as number);
  const low = Math.min(...values);
  return { low, lowPlayers: started.filter((_, i) => values[i] === low) };
}

export function leaderSummary(entries: BoardEntry[]) {
  const scored = entries.filter(e => e.score != null && !isDemotedStatus(e.status)).sort((a,b) => (a.score ?? 0)-(b.score ?? 0));
  const leader = scored[0];
  if (!leader || leader.score == null) return null;
  const tied = scored.filter(e => e.score === leader.score);
  const next = scored.find(e => e.score != null && e.score > (leader.score ?? 0));
  return { leader, count: tied.length, lead: next?.score != null ? next.score-leader.score : null };
}
export function eventLeaderLabel(name: string | null, count: number, score: number | null) {
  if (score == null) return '';
  return `${count > 1 ? `${count} tied` : surnameOf(name ?? '')} ${fmtScore(score)}`.trim();
}
export function boardTieRole(entries: BoardEntry[], index: number) {
  const e = entries[index];
  if (!e || e.position == null || isDemotedStatus(e.status)) return '';
  const prev = entries[index-1]?.position === e.position;
  const next = entries[index+1]?.position === e.position;
  return prev && next ? 'middle' : prev ? 'last' : next ? 'first' : '';
}