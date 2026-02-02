// src/features/tourhub/components/overview-v3/SeasonLeaderboards/PodiumCard.tsx

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SkillProgressBar } from './SkillProgressBar';
import { RANK_COLORS, CARD_GRADIENTS, SPRING_CONFIG } from './constants';
import type { LeaderboardPlayer } from './types';

interface PodiumCardProps {
  player: LeaderboardPlayer;
  rank: 1 | 2 | 3;
  variant: 'hero' | 'secondary';
}

export const PodiumCard = memo(function PodiumCard({ player, rank, variant }: PodiumCardProps) {
  const navigate = useNavigate();
  const isHero = variant === 'hero';

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <motion.div
      onClick={handleTap}
      whileTap={{ scale: 0.98 }}
      transition={SPRING_CONFIG.snappy}
      className={`
        relative overflow-hidden rounded-3xl cursor-pointer
        ${isHero ? 'aspect-[4/5]' : 'aspect-[3/4]'}
      `}
    >
      {/* Background Image */}
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt={player.playerName}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <span className={`font-bold text-white/50 ${isHero ? 'text-6xl' : 'text-4xl'}`}>
            {player.initials}
          </span>
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${CARD_GRADIENTS[rank]}`}
        style={{ top: '40%' }}
      />

      {/* Rank Badge */}
      <div className="absolute top-3 left-3">
        <div
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-gradient-to-r ${RANK_COLORS[rank]} shadow-lg
          `}
        >
          <span className={`font-bold text-white ${isHero ? 'text-lg' : 'text-base'}`}>
            #{rank}
          </span>
          {rank === 1 && <span>🏆</span>}
        </div>
      </div>

      {/* Skill Level Badge */}
      <div className="absolute top-3 right-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
          <span className={`font-semibold text-white ${isHero ? 'text-sm' : 'text-xs'}`}>
            Lv.{player.skillLevel}
          </span>
        </div>
      </div>

      {/* Content - Bottom */}
      <div className={`absolute bottom-0 left-0 right-0 ${isHero ? 'p-5' : 'p-4'}`}>
        {/* Player Name */}
        <h3
          className={`font-bold text-white leading-tight mb-2 ${
            isHero ? 'text-2xl' : 'text-lg'
          }`}
        >
          {player.playerName}
        </h3>

        {/* Stat Value */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className={`font-bold text-white ${isHero ? 'text-3xl' : 'text-2xl'}`}>
            {player.statDisplayValue}
          </span>
          {player.statUnit && (
            <span className={`text-white/70 ${isHero ? 'text-lg' : 'text-base'}`}>
              {player.statUnit}
            </span>
          )}
        </div>

        {/* Skill Progress Bar */}
        <SkillProgressBar
          level={player.skillLevel}
          progress={player.skillProgress}
          variant={isHero ? 'large' : 'small'}
        />
      </div>
    </motion.div>
  );
});
