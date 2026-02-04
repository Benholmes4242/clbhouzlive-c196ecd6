/**
 * LeaderboardList - Ranks 4-10 list view
 * 
 * Features:
 * - Consistent with World Rankings table style
 * - Alternating row backgrounds
 * - Country flags in list rows
 * - Blue stat values
 * - Press state animation
 * - Accessibility labels
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
    <div role="list" aria-label="Leaderboard positions 4-10">
      {players.map((player, index) => (
        <LeaderboardRow
          key={player.playerId}
          player={player}
          isLast={index === players.length - 1}
          isEven={index % 2 === 1}
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  );
});
