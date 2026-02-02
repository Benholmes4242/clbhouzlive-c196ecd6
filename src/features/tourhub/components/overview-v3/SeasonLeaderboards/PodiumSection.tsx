// src/features/tourhub/components/overview-v3/SeasonLeaderboards/PodiumSection.tsx

import { memo } from 'react';
import { PodiumCard } from './PodiumCard';
import type { LeaderboardPlayer } from './types';

interface PodiumSectionProps {
  players: LeaderboardPlayer[];
}

export const PodiumSection = memo(function PodiumSection({ players }: PodiumSectionProps) {
  if (players.length < 3) return null;

  const [first, second, third] = players;

  return (
    <div className="space-y-4">
      {/* Primary #1 Card - Hero treatment */}
      <PodiumCard player={first} rank={1} variant="hero" />

      {/* Secondary Cards - #2 and #3 side by side */}
      <div className="grid grid-cols-2 gap-3">
        <PodiumCard player={second} rank={2} variant="secondary" />
        <PodiumCard player={third} rank={3} variant="secondary" />
      </div>
    </div>
  );
});
