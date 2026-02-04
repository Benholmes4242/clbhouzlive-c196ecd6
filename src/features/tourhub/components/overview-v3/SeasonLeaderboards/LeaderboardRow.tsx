/**
 * LeaderboardRow - Individual Row for Ranks 4-10
 * 
 * Features:
 * - Consistent styling with World Rankings
 * - Country flag display
 * - Blue stat values
 * - Alternating row backgrounds
 * - Press state animation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isEven: boolean;
  animationDelay: number;
}

function truncateName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '…';
}

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const LeaderboardRow = memo(function LeaderboardRow({
  player,
  isEven,
  animationDelay,
}: LeaderboardRowProps) {
  const navigate = useNavigate();

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  // Resolve player photo
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);

  return (
    <motion.button
      onClick={handleTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-slate-100/80 border-b"
      style={{ 
        backgroundColor: isEven ? 'rgba(0, 0, 0, 0.015)' : 'transparent',
        borderColor: 'rgba(0, 0, 0, 0.04)',
        height: '72px',
      }}
      role="listitem"
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.countryCode}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-[15px] font-semibold text-slate-900">
          {player.rank}
        </span>
      </div>

      {/* Avatar */}
      <div 
        className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100"
        style={{
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initials');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="fallback-initials w-full h-full bg-slate-200 flex items-center justify-center"
          style={{ display: photoUrl ? 'none' : 'flex' }}
        >
          <span className="text-xs font-bold text-slate-400">{player.initials}</span>
        </div>
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="font-semibold text-slate-900 text-[15px] truncate leading-tight"
          title={player.playerName}
        >
          {truncateName(player.playerName)}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
          <span className="text-[12px] text-slate-500/80 truncate">
            {formatCountryName(player.countryCode)}
          </span>
        </div>
      </div>

      {/* Stat Value */}
      <div className="flex items-baseline gap-0.5 flex-shrink-0">
        <span className="font-semibold text-blue-600 text-[16px]">
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[13px] text-slate-500/70">
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300/60 flex-shrink-0" />
    </motion.button>
  );
});
