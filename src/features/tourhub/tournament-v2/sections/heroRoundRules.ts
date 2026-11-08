/** Hero-only availability stays score-based; an empty selected scorecard keeps
 * its chip enabled and selected, showing dots and the missing-card footer note.
 * Never read other rounds to infer availability. Number order ignores starting tee. */
import type { BoardEntry } from '../../leaderboard/BoardTable';
import type { BoardHole } from '../../leaderboard/useBoardHoles';

export function heroStartedRounds(entry: BoardEntry, currentRound?: number | null): number[] {
  const rounds = [entry.round_1, entry.round_2, entry.round_3, entry.round_4]
    .flatMap((score, index) => typeof score === 'number' && Number.isFinite(score) ? [index + 1] : []);
  if (currentRound && entry.today_round === currentRound && (entry.thru ?? 0) > 0 && !rounds.includes(currentRound)) rounds.push(currentRound);
  return rounds.sort((a, b) => a - b);
}
export function heroDefaultRound(rounds: number[], currentRound?: number | null): number | null {
  return currentRound && rounds.includes(currentRound) ? currentRound : rounds.at(-1) ?? null;
}
export function heroNineTotal(holes: ReadonlyArray<BoardHole | null>, from: number): number | null {
  const nine = holes.slice(from, from + 9);
  return nine.length === 9 && nine.every(h => h?.strokes != null && h.strokes > 0)
    ? nine.reduce((total, h) => total + (h?.strokes ?? 0), 0) : null;
}