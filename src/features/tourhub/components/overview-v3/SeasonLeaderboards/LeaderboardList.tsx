// src/features/tourhub/components/overview-v3/SeasonLeaderboards/LeaderboardList.tsx

import { memo } from 'react';
import { LeaderboardRow } from './LeaderboardRow';
import type { LeaderboardPlayer } from './types';

interface LeaderboardListProps {
  players: LeaderboardPlayer[];
}

export const LeaderboardList = memo(function LeaderboardList({ players }: LeaderboardListProps) {
  if (players.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="divide-y divide-gray-50">
        {players.map((player, index) => (
          <LeaderboardRow
            key={player.playerId}
            player={player}
            isLast={index === players.length - 1}
            animationDelay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
});
