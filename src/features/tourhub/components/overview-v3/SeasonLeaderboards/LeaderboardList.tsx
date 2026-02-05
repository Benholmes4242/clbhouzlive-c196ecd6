/**
 * LeaderboardList - Ranks 4-10 List (inside unified card)
 * 
 * Features:
 * - No wrapper styling (card container handles this)
 * - Staggered animation on rows
 */

import { memo } from 'react';
import { LeaderboardRow } from './LeaderboardRow';
import type { LeaderboardPlayer } from './types';

interface LeaderboardListProps {
  players: LeaderboardPlayer[];
}

export const LeaderboardList = memo(function LeaderboardList({ players }: LeaderboardListProps) {
  if (players.length === 0) return null;

  return (
    <div 
      role="list"
      aria-label="Leaderboard positions 4 through 10"
    >
      {players.map((player, index) => (
        <LeaderboardRow
          key={player.playerId}
          player={player}
          animationDelay={index * 0.03}
        />
      ))}
    </div>
  );
});
