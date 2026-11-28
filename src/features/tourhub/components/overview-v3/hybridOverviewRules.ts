/** Briefs 48–48C: overview-only presentation rules. Cut authority, scored
 * rounds, event membership and skins calculations stay in their canon owners. */
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { isActiveEntry, missedCut, liveFactCells, type LiveFactInput } from './liveStateRules';
import { resolveCutDisplay, type CutInput } from '../../_shared/cutDisplay';
import { fmtScore } from '../../utils/fmtScore';
import { upcomingFactCells } from './UpcomingOverviewSections';

export interface HybridTile { key: string; label: string; value: string; under?: boolean; finished?: number; playing?: number }
export function hybridLiveTiles(input: LiveFactInput, team = false): HybridTile[] {
  // Ask the existing source for each figure; unavailable figures stay absent.
  const ordinary = liveFactCells(input);
  const avg = liveFactCells({ ...input, stage: 'inPlay' }).find(c => c.key === 'scoringAvg');
  const cells = [...ordinary, ...(avg && !ordinary.some(c => c.key === avg.key) ? [avg] : [])];
  const label: Record<string, string> = { field: 'Field', purse: 'Purse', par: 'Par', yards: 'Yards', lowRound: 'Low round', scoringAvg: 'Scoring avg', madeCut: 'Made cut', lead: 'Lead', tied: 'Lead', underPar: 'Under par' };
  const take = (keys: string[]) => keys.flatMap(key => { const c = cells.find(c => c.key === key); return c ? [{ key, label: label[key], value: c.value, under: c.toPar != null && c.toPar < 0 }] : []; });
  if (input.stage === 'beforeTee') return take(['field', 'purse', 'par', 'yards']).slice(0, 3);
  if (input.stage === 'between') return take(['lowRound', 'scoringAvg', 'underPar']);
  const playingRows = input.entries.filter(e => input.stage === 'afterCut' || input.stage === 'final' ? !missedCut(e) : true);
  const finished = playingRows.filter(e => todayFromEntry(e, input.round) != null && (e.thru ?? 0) >= 18).length;
  const ring: HybridTile = { key: 'finished', label: team ? 'Teams finished' : 'Finished', value: String(finished), finished, playing: playingRows.length };
  if (team) return [ring, ...take(['lowRound']), { key: 'teams', label: 'Teams', value: String(input.entries.length) }];
  return [ring, ...take(['lowRound', input.stage === 'afterCut' ? 'madeCut' : input.stage === 'final' ? (cells.some(c => c.key === 'tied') ? 'tied' : 'lead') : 'scoringAvg'])];
}
export function hybridUpcomingTiles(args: { field: number; purse: number | null; wonAt: number | null; par: number | null; yards: number | null; par5s: number | null }): HybridTile[] {
  const original = upcomingFactCells(null, null, args.field, args.purse, args.par, args.yards, false, args.par5s, args.wonAt);
  // The existing four-cell cap is irrelevant to the new three-cell priority.
  const won = args.wonAt != null ? { key: 'wonAt', value: fmtScore(args.wonAt) } : null;
  const all = [...original, ...(won && !original.some(c => c.key === 'wonAt') ? [won] : []), ...(args.par5s != null && !original.some(c => c.key === 'par5s') ? [{ key: 'par5s', value: String(args.par5s) }] : [])];
  const labels: Record<string, string> = { field: 'Field', purse: 'Purse', wonAt: 'Won at', par: 'Par', yards: 'Yards', par5s: 'Par 5s' };
  return ['field', 'purse', 'wonAt', 'par', 'yards', 'par5s'].flatMap(key => { const c = all.find(c => c.key === key); return c ? [{ key, value: c.value, label: labels[key], under: key === 'wonAt' && args.wonAt != null && args.wonAt < 0 }] : []; }).slice(0, 3);
}
export function hybridCutFooter(cut: CutInput, entries: BoardEntry[]): { kind: 'actual' | 'projected'; line: string; count: number } | null {
  const shown = resolveCutDisplay(cut);
  if (shown.kind === 'none' || shown.cutline == null) return null;
  return { kind: shown.kind, line: fmtScore(shown.cutline), count: shown.kind === 'projected' ? entries.filter(e => isActiveEntry(e) && e.score != null && e.score <= shown.cutline).length : entries.filter(e => !missedCut(e)).length };
}
export function hybridCompletedTiles(entries: BoardEntry[], winner: BoardEntry | null, cut: CutInput): HybridTile[] {
  const others = entries.filter(e => e.id !== winner?.id && e.score != null);
  const runnerScore = others.length ? Math.min(...others.map(e => e.score as number)) : null;
  const margin = winner?.score != null && runnerScore != null ? runnerScore - winner.score : null;
  const rounds = entries.flatMap(e => [e.round_1, e.round_2, e.round_3, e.round_4]).filter((v): v is number => v != null && Number.isFinite(v));
  const footer = hybridCutFooter(cut, entries);
  return [...(margin != null ? [{ key: 'margin', label: 'Winning margin', value: margin === 0 ? 'PO' : String(margin) }] : []), ...(rounds.length ? [{ key: 'lowRound', label: 'Low round', value: fmtScore(Math.min(...rounds)), under: Math.min(...rounds) < 0 }] : []), { key: 'field', label: footer ? 'Made the cut' : 'Field', value: String(footer?.count ?? entries.length) }];
}
export function hybridBoardRounds(round: number, completed: boolean): number[] { return completed ? Array.from({ length: round }, (_, i) => i + 1) : round > 1 ? [round] : []; }
export function hybridFinalWeekday(endDate: string | null | undefined): string | null {
  if (!endDate || !Number.isFinite(Date.parse(endDate))) return null;
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${endDate.slice(0, 10)}T12:00:00Z`));
}
/** Stored round columns are authoritative for historical/final cells. The TODAY
 * helper intentionally refuses another round when today_round differs; it must
 * not suppress an available round_n field in an overview round column. */
export function hybridRoundValue(entry: BoardEntry, round: number): number | null {
  return [entry.round_1, entry.round_2, entry.round_3, entry.round_4][round - 1] ?? todayFromEntry(entry, round);
}
