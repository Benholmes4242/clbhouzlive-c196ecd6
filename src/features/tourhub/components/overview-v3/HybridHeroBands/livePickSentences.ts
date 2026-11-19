/** Overview-only pick sentences derive from the loaded board and canonical cut
 * display. Translation values use named bold slots, never HTML from player data. */
import type { BoardEntry } from '../../../leaderboard/BoardTable';
import { todayFromEntry } from '../../../leaderboard/BoardTable';
import { resolveCutDisplay, type CutInput } from '../../../_shared/cutDisplay';
import { surnameOf } from '../../../_shared/playerName';
import { fmtScore } from '../../../utils/fmtScore';
import { isActiveEntry, type LiveStage } from '../liveStateRules';

type Pick = { playerId: string; playerName: string };
export type PickSentence = { key: string; values: Record<string, string | number>; replace: boolean };
export function livePickSentences(stage: LiveStage, round: number, picks: Pick[], entries: BoardEntry[], cut: CutInput): PickSentence[] {
  const rows = picks.slice(0, 3).flatMap(p => {
    const row = entries.find(e => e.player?.id === p.playerId);
    return row && isActiveEntry(row) ? [{ row, name: surnameOf(p.playerName) }] : [];
  });
  const sentence = (key: string, values: PickSentence['values'], replace = false): PickSentence[] => [{ key: `overview.live.picks.${key}`, values, replace }];
  if (stage === 'cutRound') {
    const display = resolveCutDisplay(cut);
    if (display.kind !== 'projected' || display.cutline == null) return [];
    const outside = rows.filter(p => p.row.score != null && p.row.score > display.cutline);
    if (outside.length === 3) return sentence('outsideThree', {});
    if (outside.length === 2) return sentence('outsideTwo', { a: outside[0].name, b: outside[1].name });
    if (outside.length === 1) return sentence('outsideOne', { name: outside[0].name });
  }
  if (stage === 'suspended') {
    const unfinished = rows.filter(p => todayFromEntry(p.row, round) != null && p.row.thru != null && p.row.thru > 0 && p.row.thru < 18);
    if (unfinished.length >= 2) return sentence(unfinished.length === 3 ? 'finishThree' : 'finishMany', { a: unfinished[0].name, b: unfinished[1].name, c: unfinished[2]?.name ?? '' });
    if (unfinished.length === 1) {
      const p = unfinished[0];
      const count = 18 - (p.row.thru ?? 0);
      return sentence(count === 1 ? 'finishOneHole' : 'finishHoles', { name: p.name, count });
    }
  }
  if (stage === 'final') {
    const best = rows.filter(p => p.row.position != null && p.row.score != null).sort((a, b) => (a.row.position ?? Infinity) - (b.row.position ?? Infinity))[0];
    const leader = entries.filter(e => isActiveEntry(e) && e.score != null).sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity))[0];
    if (!best || !leader || best.row.score == null || leader.score == null || todayFromEntry(best.row, round) == null || (best.row.thru ?? 0) < 18) return [];
    const gap = best.row.score - leader.score;
    const values = { name: best.name, score: fmtScore(best.row.score) };
    if (gap === 0 && (best.row.position_tied || entries.filter(e => isActiveEntry(e) && e.score === leader.score).length > 1)) return sentence('clubhouseLevel', values, true);
    if (gap > 0) return sentence('clubhouseBehind', { ...values, gap, leader: surnameOf(leader.player?.full_name ?? leader.team?.display_name ?? '') }, true);
  }
  return [];
}

/** The sentence owns shot singular/plural; this supplies the gap's number. */
export function pickGapNumber(gap: number, t: (key: string) => string): string {
  return gap <= 10 ? t(`overview.live.picks.numbers.${gap}`) : String(gap);
}