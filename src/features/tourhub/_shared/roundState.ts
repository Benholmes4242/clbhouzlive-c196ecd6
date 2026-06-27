// Client-side mirror of supabase/functions/_shared/roundState.ts `roundStarted`.
// Vite can't import from supabase/functions, so the definition is duplicated —
// both must stay in lockstep. See the edge-side file for rationale.
//
// "Round started" = at least one hole played by this competitor.
// Used by CinematicFrame.liveRoundFor and FullLeaderboard.getLiveRoundData
// so the hero and the leaderboard agree on when to show TODAY data.
export function roundStarted(r: any): boolean {
  if (!r) return false;
  const thru = r.thru ?? 0;
  const strokes = r.strokes ?? 0;
  return !(thru === 0 && strokes === 0);
}
