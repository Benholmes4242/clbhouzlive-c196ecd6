// src/features/tourhub/components/overview-v3/SeasonLeaderboards/LeaderboardRow.tsx

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SkillProgressBar } from './SkillProgressBar';
import type { LeaderboardPlayer } from './types';

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isLast: boolean;
  animationDelay: number;
}

export const LeaderboardRow = memo(function LeaderboardRow({
  player,
  isLast,
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
      className={`
        w-full flex items-center gap-3 px-4 py-3
        hover:bg-white/60 active:bg-white/80 
        transition-colors duration-150
        ${!isLast ? 'border-b border-gray-200/60' : ''}
      `}
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-600">{player.rank}</span>
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{player.initials}</span>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 truncate max-w-[140px]">{player.playerName}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {player.countryCode}
          </span>
        </div>

        {/* Skill Bar */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 max-w-[100px]">
            <SkillProgressBar
              level={player.skillLevel}
              progress={player.skillProgress}
              variant="list"
            />
          </div>
          <span className="text-xs font-medium text-gray-500">Lv.{player.skillLevel}</span>
        </div>
      </div>

      {/* Stat Value */}
      <div className="text-right flex-shrink-0">
        <span className="font-bold text-gray-900">{player.statDisplayValue}</span>
        {player.statUnit && (
          <span className="text-xs text-gray-500 ml-0.5">{player.statUnit}</span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </motion.button>
  );
});
