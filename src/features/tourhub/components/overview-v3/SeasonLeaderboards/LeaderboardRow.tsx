/**
 * LeaderboardRow - Individual row for ranks 4-10
 * 
 * Features:
 * - Consistent with World Rankings table style
 * - Slate gray rank badge (not gold/silver/bronze)
 * - Country flag display
 * - Blue stat values
 * - Alternating row backgrounds
 * - Press animation
 * - No skill progress bar (removed clutter)
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isLast: boolean;
  isEven: boolean;
  animationDelay: number;
}

export const LeaderboardRow = memo(function LeaderboardRow({
  player,
  isLast,
  isEven,
  animationDelay,
}: LeaderboardRowProps) {
  const navigate = useNavigate();

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <motion.button
      onClick={handleTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-3 px-0 py-3.5",
        "transition-colors duration-150",
        "active:bg-black/[0.02]",
        !isLast && "border-b border-black/[0.04]",
        isEven && "bg-black/[0.015]"
      )}
      role="listitem"
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.countryCode}, ${player.statDisplayValue} ${player.statUnit || ''}`}
    >
      {/* Rank Badge - Slate gray for 4+ */}
      <div className="w-8 h-8 rounded-full bg-[#64748b] flex items-center justify-center flex-shrink-0">
        <span className="text-[13px] font-bold text-white">{player.rank}</span>
      </div>

      {/* Avatar */}
      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{player.initials}</span>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-semibold text-[#1a1a1a] truncate max-w-[120px] text-[15px] leading-tight">
          {player.playerName}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {player.countryCode && (
            <CountryFlag country={player.countryCode} size="sm" />
          )}
          <span className="text-[12px] text-black/50">
            {player.countryCode}
          </span>
        </div>
      </div>

      {/* Stat Value - Blue */}
      <div className="text-right flex-shrink-0 flex items-baseline gap-0.5">
        <span className="font-semibold text-[#007AFF] text-[16px]">
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[13px] text-black/40">
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-black/30 flex-shrink-0" />
    </motion.button>
  );
});
