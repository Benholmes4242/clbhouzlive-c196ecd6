/** Section-only copy decisions; existing comparison/sheet helpers stay unchanged.
 * Circle rank is server data, never derived from the displayed face stack. */
import type { TournamentPickState } from '../../../hooks/useTournamentPick';
import type { TournamentCircleRank } from '../../../hooks/useTournamentCircleRank';
import { outStatus, type PickResult, wordNumber, resultPosition } from './pickInsightRules';
import { surnameOf } from '../../../_shared/playerName';
export type PickCopy = (key: string, options?: Record<string, unknown>) => string;
const capital = (n: number) => { const word = wordNumber(n); return word.charAt(0).toUpperCase() + word.slice(1); };
export function liveCircleHeading(rank: TournamentCircleRank | null, copy: PickCopy) {
  if (!rank) return '';
  if (rank.circle_pickers === 0) return copy('againstOurs');
  if (rank.ahead == null || rank.level == null) return '';
  if (rank.ahead === 0) return copy(rank.level > 0 ? 'levelTopCircle' : 'topCircle');
  return copy(rank.ahead === 1 ? 'oneAhead' : 'manyAhead', { words: capital(rank.ahead) });
}
export function bestActivePick(picks: PickResult[]) {
  return picks.filter(p => !outStatus(p.status) && p.position != null).slice().sort((a, b) => Number(a.position) - Number(b.position))[0] ?? null;
}
export function liveOurLine(mine: PickResult, picks: PickResult[], copy: PickCopy) {
  if (outStatus(mine.status)) return copy(['CUT','MC'].includes(mine.status?.toUpperCase() ?? '') ? 'yourMissedCut' : 'yourWithdrew');
  if (picks.some(p => p.playerId === mine.playerId)) return copy('oneOfOurs');
  const best = bestActivePick(picks);
  if (!best || mine.position == null) return '';
  return copy(mine.position < Number(best.position) ? 'aheadOurs' : mine.position === best.position ? 'levelOurs' : 'behindOurs', { name: surnameOf(best.playerName) });
}
export function finishedOurHeading(mine: PickResult, picks: PickResult[], copy: PickCopy) {
  const best = bestActivePick(picks);
  if (!best || mine.position == null) return '';
  return copy(outStatus(mine.status) || mine.position > Number(best.position) ? 'lostToOurs' : mine.position === best.position ? 'matchedOurs' : 'beatOurs');
}
export function finishedCircleLine(rank: TournamentCircleRank | null, state: TournamentPickState, copy: PickCopy) {
  if (!rank) return '';
  if (rank.circle_pickers === 0) return state.my_percentile == null ? '' : copy('beatField', { value: state.my_percentile });
  if (rank.ahead == null || rank.level == null) return '';
  const count = wordNumber(rank.circle_pickers);
  if (rank.ahead === 0) return copy(rank.level > 0 ? 'finishedLevelBest' : 'finishedBest', { count });
  if (!state.followed_best) return '';
  const best = state.followed_best;
  return copy(rank.ahead === 1 ? 'finishedOneAhead' : 'finishedManyAhead', { count, words: capital(rank.ahead), name: surnameOf(best.player_name), position: resultPosition({ playerId: best.player_id ?? '', playerName: best.player_name, position: best.position, tied: best.tied }) });
}