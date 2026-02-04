/**
 * PodiumSection - Horizontal podium layout (2nd-1st-3rd)
 * 
 * Features:
 * - Compact horizontal layout
 * - 1st place center (120x160px, 64px avatar)
 * - 2nd/3rd flanking (100x140px, 52px avatar)
 * - Entry animation on category change
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { PodiumCard } from './PodiumCard';
import type { LeaderboardPlayer, CategoryId } from './types';

interface PodiumSectionProps {
  players: LeaderboardPlayer[];
  categoryId?: CategoryId;
}

export const PodiumSection = memo(function PodiumSection({ players, categoryId }: PodiumSectionProps) {
  if (players.length < 3) return null;

  const [first, second, third] = players;

  return (
    <div 
      className="flex items-end justify-center gap-2 py-5"
      role="list"
      aria-label={`${categoryId || 'Leaderboard'} top 3`}
    >
      {/* 2nd Place - Left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
      >
        <PodiumCard player={second} rank={2} />
      </motion.div>

      {/* 1st Place - Center (Elevated) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        <PodiumCard player={first} rank={1} />
      </motion.div>

      {/* 3rd Place - Right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      >
        <PodiumCard player={third} rank={3} />
      </motion.div>
    </div>
  );
});
