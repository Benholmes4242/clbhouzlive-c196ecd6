/**
 * useIntelligenceState — Idle vs Active state derivation for IntelligenceHero.
 *
 * Per Phase A brief (audit flag 3 approved): we derive state from
 * `useAIPredictions().tournamentPhase`, NOT `useLiveRightNow()`. The
 * semantically correct question is "is the thing we have predictions for
 * currently live", not "is anything on tour live". A non-predicted tour
 * being live should keep the section in idle — we have nothing meaningful
 * to surface for it.
 */

import { useAIPredictions } from './useAIPredictions';
import type { NextTournamentPreview } from '../components/tournament-insights/types';

export type IntelligenceState = 'idle' | 'active';

export interface UseIntelligenceStateResult {
  state: IntelligenceState;
  activeTournamentId: string | null;
  nextTournament: NextTournamentPreview | null;
  isLoading: boolean;
}

export function useIntelligenceState(): UseIntelligenceStateResult {
  const { activeTournamentId, tournamentPhase, nextTournament, isLoading } =
    useAIPredictions();

  const state: IntelligenceState =
    tournamentPhase === 'in-progress' ? 'active' : 'idle';

  return {
    state,
    activeTournamentId,
    nextTournament,
    isLoading,
  };
}
