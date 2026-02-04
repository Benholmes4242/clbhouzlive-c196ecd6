/**
 * PodiumCard - Compact vertical card for horizontal podium
 * 
 * Features:
 * - 1st: 120x160px, 64px avatar
 * - 2nd/3rd: 100x140px, 52px avatar
 * - Gradient backgrounds (gold/silver/bronze tints)
 * - Rank badge at top
 * - Blue stat values
 * - No level badges or progress bars (removed clutter)
 * - Press animation (scale 0.97)
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardPlayer } from './types';

interface PodiumCardProps {
  player: LeaderboardPlayer;
  rank: 1 | 2 | 3;
}

const RANK_CONFIG = {
  1: {
    width: 120,
    height: 160,
    avatarSize: 64,
    bgGradient: 'bg-gradient-to-b from-[rgba(255,215,0,0.08)] to-white',
    borderColor: 'border-[rgba(255,215,0,0.3)]',
    badgeGradient: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]',
    badgeText: 'text-white',
  },
  2: {
    width: 100,
    height: 140,
    avatarSize: 52,
    bgGradient: 'bg-gradient-to-b from-[rgba(192,192,192,0.08)] to-white',
    borderColor: 'border-[rgba(192,192,192,0.3)]',
    badgeGradient: 'bg-gradient-to-br from-[#E8E8E8] to-[#B8B8B8]',
    badgeText: 'text-[#666]',
  },
  3: {
    width: 100,
    height: 140,
    avatarSize: 52,
    bgGradient: 'bg-gradient-to-b from-[rgba(205,127,50,0.08)] to-white',
    borderColor: 'border-[rgba(205,127,50,0.3)]',
    badgeGradient: 'bg-gradient-to-br from-[#CD7F32] to-[#A0522D]',
    badgeText: 'text-white',
  },
} as const;

export const PodiumCard = memo(function PodiumCard({ player, rank }: PodiumCardProps) {
  const navigate = useNavigate();
  const config = RANK_CONFIG[rank];

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <motion.button
      onClick={handleTap}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        "flex flex-col items-center p-3 rounded-2xl border",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "cursor-pointer",
        config.bgGradient,
        config.borderColor
      )}
      style={{ 
        width: config.width,
        height: config.height,
      }}
      aria-label={`Rank ${rank}: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit || ''}`}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl mb-3",
          "text-[13px] font-bold shadow-sm",
          config.badgeGradient,
          config.badgeText
        )}
      >
        {rank === 1 && <Trophy className="w-3 h-3" />}
        <span>#{rank}</span>
      </div>

      {/* Avatar */}
      <div 
        className="rounded-full overflow-hidden bg-slate-100 border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] mb-2.5 flex-shrink-0"
        style={{ 
          width: config.avatarSize, 
          height: config.avatarSize 
        }}
      >
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <span className={cn(
              "font-bold text-white/80",
              rank === 1 ? "text-lg" : "text-sm"
            )}>
              {player.initials}
            </span>
          </div>
        )}
      </div>

      {/* Player Name - truncated */}
      <p 
        className={cn(
          "font-semibold text-[#1a1a1a] text-center truncate w-full mb-1",
          rank === 1 ? "text-[14px]" : "text-[13px]"
        )}
        style={{ maxWidth: config.width - 24 }}
      >
        {player.playerName}
      </p>

      {/* Stat Value - Blue */}
      <div className="flex items-baseline gap-0.5">
        <span className={cn(
          "font-bold text-[#007AFF]",
          rank === 1 ? "text-[18px]" : "text-[16px]"
        )}>
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className={cn(
            "text-black/50",
            rank === 1 ? "text-[13px]" : "text-[12px]"
          )}>
            {player.statUnit}
          </span>
        )}
      </div>
    </motion.button>
  );
});
