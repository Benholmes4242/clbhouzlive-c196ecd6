/** CB58: selection uses all position-1 players and published draws, not the
 * scheduled current_round rollover. Historical round cells are completed cards
 * (live sync's roundCell gate), so scope stale top-level TODAY/THRU before
 * calling the board's own todayFromEntry/thruLabel. No input is mutated.
 * Tour 4(a): every current leader (every position-1 player, wherever they are
 * in the draw), and every other player in the selected leaders' group, must
 * have completed round N: its card, scoped 18/F or MC/CUT/WD/DQ;
 * the immediately next published draw must contain a current position-1 leader.
 * Other field rows never gate this section. Draws themselves are never filtered.
 */
import { fieldHasStarted } from '../../../overview/boardStarted';
import { todayFromEntry, type BoardEntry } from '../../../leaderboard/BoardTable';
import { thruLabel } from '../../../tournament-v2/sections/MiniBoard';
import type { TeeGroup } from '../../../tournament-v2/data/useTeeTimesAll';
import type { TeeGroupPlayer } from '../../../tournament-v2/data/useTeeTimesAll';
import { surnameOf } from '../../../_shared/playerName';

export type GroupState = 'before' | 'onCourse' | 'finished';
/** Display order only: retain draw order for tied/missing positions; terminal
 * MC/CUT/WD entries follow ranked players. Never mutate the published group. */
export function leadersPositionOrder(players: TeeGroupPlayer[], entries: BoardEntry[]): TeeGroupPlayer[] {
  const rank = (player: TeeGroupPlayer) => {
    const entry = entries.find(e => player.id != null && e.player?.id === player.id);
    if (['MC', 'CUT', 'WD'].includes(entry?.status?.toUpperCase() ?? '')) return Number.POSITIVE_INFINITY;
    return entry?.position ?? Number.MAX_SAFE_INTEGER;
  };
  return players.map((player, index) => ({ player, index })).sort((a, b) => rank(a.player) - rank(b.player) || a.index - b.index).map(item => item.player);
}
export function allLeaders(entries: BoardEntry[]): BoardEntry[] {
  return entries.filter(e => e.position === 1 && e.player?.id);
}
export function roundEntry(entry: BoardEntry, round: number): BoardEntry {
  const card = [entry.round_1, entry.round_2, entry.round_3, entry.round_4][round - 1];
  if (card != null && entry.today_round !== round) {
    return { ...entry, today: card, today_round: round, thru: 18 };
  }
  return entry;
}
export function groupState(group: TeeGroup, entries: BoardEntry[], round: number): GroupState {
  const states = group.players.map(p => {
    const raw = entries.find(e => e.player?.id === p.id);
    if (!raw) return { started: false, finished: false };
    const e = roundEntry(raw, round);
    const today = todayFromEntry(e, round);
    return { started: today != null, finished: thruLabel(e, today) === 'F' };
  });
  if (states.length > 0 && states.every(s => s.finished)) return 'finished';
  return states.some(s => s.started) ? 'onCourse' : 'before';
}
export function candidateGroups(groups: TeeGroup[], leaders: BoardEntry[]): TeeGroup[] {
  const ids = new Set(leaders.map(e => e.player?.id));
  return groups.filter(g => g.players.some(p => p.id != null && ids.has(p.id)));
}
const teeEpoch = (g: TeeGroup) => Number.isFinite(Date.parse(g.teeTime)) ? Date.parse(g.teeTime) : 0;
export function pickLeadersGroup(groups: TeeGroup[], leaders: BoardEntry[], entries: BoardEntry[], round: number): TeeGroup | null {
  const ids = new Set(leaders.map(e => e.player?.id));
  const count = (g: TeeGroup) => g.players.filter(p => p.id != null && ids.has(p.id)).length;
  return candidateGroups(groups, leaders).map((group, index) => ({ group, index })).sort((a, b) =>
    count(b.group) - count(a.group) ||
    Number(groupState(b.group, entries, round) === 'onCourse') - Number(groupState(a.group, entries, round) === 'onCourse') ||
    teeEpoch(b.group) - teeEpoch(a.group) || a.index - b.index,
  )[0]?.group ?? null;
}
/** Ignore early scheduled-round advancement until leaders' played-round data
 * catches up. A late advancement does not block the published next draw. */
export function leadersBaseRound(leaders: BoardEntry[], currentRound: number): number {
  const played = leaders.map(e => {
    if (e.today != null && e.today_round != null) return e.today_round;
    const cards = [e.round_1, e.round_2, e.round_3, e.round_4];
    return cards.reduce((n, score, i) => score != null ? i + 1 : n, 1);
  });
  return Math.min(currentRound, Math.max(1, ...played));
}
export function leadersShownRound(baseRound: number, groups: TeeGroup[], leaders: BoardEntry[], entries: BoardEntry[], drawnRounds: number[], totalRounds: number, nextGroups: TeeGroup[] = []): number {
  const next = baseRound + 1;
  const group = pickLeadersGroup(groups, leaders, entries, baseRound);
  if (!group || next > totalRounds || !drawnRounds.includes(next) || candidateGroups(nextGroups, leaders).length === 0) return baseRound;
  const completionPlayers = [...group.players, ...leaders.map(leader => ({ id: leader.player?.id ?? null }))];
  const groupComplete = group.players.length > 0 && completionPlayers.every(player => {
    const raw = entries.find(entry => player.id != null && entry.player?.id === player.id);
    if (!raw) return false;
    if (['MC', 'CUT', 'WD', 'DQ'].includes(raw.status?.trim().toUpperCase() ?? '')) return true;
    if ([raw.round_1, raw.round_2, raw.round_3, raw.round_4][baseRound - 1] != null) return true;
    const e = roundEntry(raw, baseRound);
    // A stale top-level thru from an earlier round must not finish this one.
    return (raw.today_round == null || raw.today_round === baseRound)
      && (e.thru === 18 || thruLabel(e, todayFromEntry(e, baseRound)) === 'F');
  });
  return groupComplete ? next : baseRound;
}
export function leadersGroupVisible(phase: string, teamEvent: boolean, entries: BoardEntry[], loading: boolean): boolean {
  return phase === 'live' && !teamEvent && !loading && fieldHasStarted(entries) && entries.some(e => typeof e.score === 'number' && Number.isFinite(e.score));
}
export function otherLeaders(group: TeeGroup, leaders: BoardEntry[], groups: TeeGroup[]): BoardEntry[] {
  const shown = new Set(group.players.map(p => p.id));
  const time = (e: BoardEntry) => {
    const g = groups.find(g => g.players.some(p => p.id === e.player?.id));
    return g ? teeEpoch(g) : Number.POSITIVE_INFINITY;
  };
  return leaders.filter(e => !shown.has(e.player?.id ?? null)).sort((a, b) => time(a) - time(b));
}
/** Translation owns grammar; surnames are rendered separately in full ink. */
export function leadersNote(other: BoardEntry[]): { key: string; names: string[]; count: number } | null {
  if (other.length === 0) return null;
  return { key: other.length === 1 ? 'one' : other.length < 4 ? 'named' : 'many',
    names: other.length < 4 ? other.map(e => surnameOf(e.player?.full_name)) : [], count: other.length };
}