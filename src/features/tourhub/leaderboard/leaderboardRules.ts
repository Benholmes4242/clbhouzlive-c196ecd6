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