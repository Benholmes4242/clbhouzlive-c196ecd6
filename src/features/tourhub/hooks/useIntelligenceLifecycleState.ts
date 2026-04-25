/**
 * useIntelligenceLifecycleState
 *
 * Derives the IntelligenceHero lifecycle state, mirroring the Hero carousel's
 * 1.5-day "recently completed" window so both surfaces transition in lockstep.
 *
 * Source-of-truth chain:
 *   useAIPredictions().tournamentPhase  →  this hook applies a 36h end-date
 *   override so the section stays in sync with the Hero carousel (which uses
 *   1.5d) instead of the hook's internal 72h window.
 *
 * State derivation:
 *   - 'live'     → tournamentPhase === 'in-progress'
 *   - 'results'  → tournamentPhase === 'completed' AND end_date >= now − 36h
 *   - 'upcoming' → everything else (including completed-but-stale)
 *
 * Data payload selection:
 *   - live / results → use `data` (active or just-finished tournament)
 *   - upcoming       → use `nextTournamentPredictions` (the next scheduled event)
 *
 * Realtime: invalidation propagates automatically via
 * `useTournamentStatusRealtime` (mounted globally in TourHubMainPage), which
 * invalidates the `['ai-predictions']` query key on `sr_tournaments` UPDATE.
 */

import { useAIPredictions, type AIPredictionData } from './useAIPredictions';

export type IntelligenceLifecycleState = 'live' | 'results' | 'upcoming';

export interface UseIntelligenceLifecycleStateResult {
  state: IntelligenceLifecycleState;
  activeTournamentId: string | null;
  /** Active or just-finished tournament payload (used by live + results states). */
  data: AIPredictionData | null | undefined;
  /** Next scheduled tournament payload (used by upcoming state). */
  nextTournamentPredictions: AIPredictionData | null;
  isLoading: boolean;
}

/** 1.5 days, matching `useTournamentsCache` and HeroCarousel display window. */
const RESULTS_WINDOW_MS = 36 * 60 * 60 * 1000;

export function useIntelligenceLifecycleState(): UseIntelligenceLifecycleStateResult {
  const {
    data,
    activeTournamentId,
    tournamentPhase,
    nextTournamentPredictions,
    isLoading,
  } = useAIPredictions();

  let state: IntelligenceLifecycleState;

  if (tournamentPhase === 'in-progress') {
    state = 'live';
  } else if (tournamentPhase === 'completed' && data?.tournament?.endDate) {
    const endDateMs = new Date(data.tournament.endDate).getTime();
    const cutoffMs = Date.now() - RESULTS_WINDOW_MS;
    state = endDateMs >= cutoffMs ? 'results' : 'upcoming';
  } else {
    state = 'upcoming';
  }

  return {
    state,
    activeTournamentId,
    data,
    nextTournamentPredictions,
    isLoading,
  };
}
