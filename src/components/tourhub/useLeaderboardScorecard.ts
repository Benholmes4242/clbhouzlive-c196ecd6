/**
 * useLeaderboardScorecard — state manager for the leaderboard ↔ scorecard transition.
 * 
 * Drop this hook into the existing leaderboard glass card component.
 * It manages which view is active (leaderboard vs. player scorecard)
 * and provides the transition callbacks.
 * 
 * Usage in the existing leaderboard component:
 * 
 * ```tsx
 * const { selectedPlayer, selectPlayer, clearPlayer, isShowingScorecard } = useLeaderboardScorecard();
 * 
 * // In the leaderboard row tap handler:
 * <button onClick={() => selectPlayer(playerInfo)}>
 *   {player.name}
 * </button>
 * 
 * // In the glass card render:
 * <AnimatePresence mode="wait">
 *   {isShowingScorecard ? (
 *     <PlayerScorecardCard
 *       key="scorecard"
 *       player={selectedPlayer}
 *       onBack={clearPlayer}
 *       onClose={onClose}
 *       {...tournamentProps}
 *     />
 *   ) : (
 *     <LeaderboardView key="leaderboard" ... />
 *   )}
 * </AnimatePresence>
 * ```
 */
import { useState, useCallback } from 'react';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';

export function useLeaderboardScorecard() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);

  const selectPlayer = useCallback((player: PlayerInfo) => {
    setSelectedPlayer(player);
  }, []);

  const clearPlayer = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  return {
    selectedPlayer,
    selectPlayer,
    clearPlayer,
    isShowingScorecard: selectedPlayer !== null,
  };
}
