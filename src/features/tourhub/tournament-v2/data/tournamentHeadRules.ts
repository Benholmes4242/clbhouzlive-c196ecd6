/** Brief 17: selected-event heading facts only. Existing round standings,
 * board TODAY, course amounts and Brief 16 builders remain authoritative.
 * No read or row/plot mutation belongs in these pure presentation rules. */
import { titleCountWords } from '../../components/overview-v3/overviewTokens';
import { leaderboardTitle, runnerUpTitle, midWord, type T } from '../../components/overview-v3/heroHeadRules';
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { PickFieldPlayer } from '../../hooks/useTournamentPick';
import type { EventMoment } from '../../hooks/useEventMoments';
import { surnameOf } from '../../_shared/playerName';
import { playedRounds, roundStanding, amount, ordinal, cap, copy, type Part, type Phase } from './tournamentRules';

const key = (s: string) => `tournamentHead.${s}`;
const inactive = new Set(['MC', 'CUT', 'WD', 'DQ', 'DNS', 'MDF']);
export function roundInPlay(meta: TournamentMeta): boolean {
  return !['complete', 'closed', 'scheduled', 'suspended'].includes(meta.current_round_status ?? '');
}
export function boardTitle(t: T, rows: BoardEntry[], phase: Phase, championId: string | null): string {
  if (phase !== 'completed') return leaderboardTitle(t, rows.map(r => ({ name: surnameOf(r.player?.full_name ?? ''), score: r.score, status: r.status })));
  const active = rows.filter(r => r.player && r.score != null && !inactive.has((r.status ?? '').toUpperCase())).sort((a,b) => (a.score ?? 0) - (b.score ?? 0));
  const champion = active.find(r => r.player?.id === championId || r.player?.sr_id === championId) ?? active.find(r => r.position === 1 && !r.position_tied);
  if (!champion) return '';
  const next = active.find(r => r.id !== champion.id);
  return runnerUpTitle(t, active.map(r => ({ name: surnameOf(r.player?.full_name ?? ''), total: r.score ?? 0, champion: r.id === champion.id })), next?.score === champion.score);
}
export function unfoldingTitle(t: T, rows: BoardEntry[]): string {
  const n = playedRounds(rows);
  if (!n) return '';
  const rounds = Array.from({ length: n }, (_, i) => roundStanding(rows, i + 1).filter(r => r.rank === 1));
  const last = rounds[n - 1];
  if (!last?.length) return '';
  const opts = { count: n, rounds: midWord(n,t) };
  if (last.length === 2) return t(key('race.levelTwo'), { ...opts, a: surnameOf(last[0].row.player?.full_name ?? ''), b: surnameOf(last[1].row.player?.full_name ?? '') });
  if (last.length > 2) return t(key('race.levelMany'), { ...opts, leaders: titleCountWords(last.length,t) });
  const leader = last[0].row, name = surnameOf(leader.player?.full_name ?? '');
  const sole = (i: number) => rounds[i]?.length === 1 && rounds[i][0].row.id === leader.id;
  if (n >= 2 && rounds.every((_,i) => sole(i))) return t(key('race.every'), { name });
  if (n === 1) return t(key('race.firstRound'), { name });
  let start = n - 1;
  while (start > 0 && sole(start - 1)) start--;
  return start === n - 1 ? t(key('race.firstLead'), { name }) : t(key('race.since'), { name, round: midWord(start + 1,t) });
}
export function unfoldingNarrative(parts: Part[], phase: Phase, keepOpening = false): Part[] {
  const rest = phase === 'live' && parts[0]?.bold && !keepOpening ? parts.slice(1) : parts;
  return rest.map((p,i) => i === 0 ? { ...p, text: p.text.trimStart() } : p);
}
export function numbersTitle(t: T, meta: TournamentMeta, phase: Phase, rows: BoardEntry[]): string {
  const round = meta.current_round ?? playedRounds(rows);
  const active = rows.filter(r => !inactive.has((r.status ?? '').toUpperCase()));
  const count = active.filter(r => { const value = phase === 'completed' ? r.score : todayFromEntry(r,round); return value != null && Number.isFinite(value) && value < 0; }).length;
  const mode = phase === 'completed' ? 'finished' : roundInPlay(meta) ? 'today' : 'round';
  return t(key(`numbers.${mode}${count === 0 ? '_zero' : ''}`), { count, words: titleCountWords(count,t), round: midWord(round,t) });
}
export function hardestTitle(t: T, hole: number, phase: Phase): string {
  return t(key(phase === 'completed' ? 'course.played' : 'course.playing'), { hole: ordinal(hole) });
}
export function playedCourseLine(t: T, parts: Part[], average: number, phase: Phase): Part[] {
  const value = amount(average);
  return [{ text: t(key(phase === 'completed' ? 'course.amount' : 'course.soFarAmount'), { amount: phase === 'completed' ? cap(value) : value }) }, ...parts.slice(2)];
}
export function fieldTitle(t: T, field: PickFieldPlayer[]): string {
  const ranked = field.filter(p => p.world_rank != null && p.world_rank >= 1);
  const top50 = ranked.filter(p => (p.world_rank ?? Infinity) <= 50).length;
  const top100 = ranked.filter(p => (p.world_rank ?? Infinity) <= 100).length;
  if (!top100) return t(key('field.none'));
  const hundred = top100 === 1 ? t(key('oneLower')) : titleCountWords(top100,t).toLocaleLowerCase();
  return t(key(top50 === 0 ? 'field.noFifty' : 'field.ranked'), { count: top50, words: titleCountWords(top50,t), top100: hundred });
}
export function fieldStrength(parts: Part[]): Part[] { return parts.filter(p => p.bold); }
export const notableKinds = ['ace','albatross','record','comeback','playoff','eagle','streak','milestone'] as const;
export function momentsTitle(t: T, moments: Pick<EventMoment,'moment_type'>[], phase: Phase, form: 'full' | 'records' | 'plain' = 'full'): string {
  const n = moments.length;
  if (!n) return '';
  const kind = notableKinds.find(kind => moments.some(m => m.moment_type === kind));
  const suffix = t(key(phase === 'completed' ? 'moments.thisWeek' : 'moments.soFar'));
  const opts = { count: n, words: titleCountWords(n,t), suffix };
  if (!kind || form === 'plain') return t(key('moments.plain'), opts);
  const k = moments.filter(m => m.moment_type === kind).length;
  const noun = t(key(`moments.kinds.${kind === 'record' && form === 'records' ? 'recordShort' : kind}`), { count: k });
  if (k === n) return t(key('moments.allKind'), { ...opts, kind: noun });
  const quantity = k === 1 ? t(key('oneLower')) : titleCountWords(k,t).toLocaleLowerCase();
  return t(key('moments.mixed'), { ...opts, quantity, kind: noun });
}

// Each layout choice is pure and independently covered at one/two/three lines.
export const boardHeadForm = (lines: number) => lines > 2;
export const unfoldingHeadForm = (lines: number) => lines > 2;
export const momentsRecordHeadForm = (lines: number) => lines > 2;
export const momentsPlainHeadForm = (lines: number) => lines > 2;
export function sharedLeadPair(rows: BoardEntry[]): boolean {
  const active = rows.filter(r => r.score != null && Number.isFinite(r.score) && !inactive.has((r.status ?? '').toUpperCase()));
  const lead = Math.min(...active.map(r => r.score ?? Infinity));
  return active.filter(r => r.score === lead).length === 2;
}
export function unfoldingFallbackTitle(t: T, rows: BoardEntry[]): string | undefined {
  const n = playedRounds(rows);
  if (roundStanding(rows,n).filter(r => r.rank === 1).length !== 2) return undefined;
  return t(key('race.levelCount'), { count: n, rounds: midWord(n,t) });
}