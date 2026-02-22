/**
 * LeaderboardRow - Individual Row for Ranks 4-10
 * 
 * Features:
 * - 40px rounded avatars with category accent placeholders
 * - Monospace stat values
 * - Visible chevrons with hover animation
 * - No hard truncation - CSS ellipsis
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  animationDelay: number;
  accentColor: CategoryId;
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
  animationDelay,
  accentColor,
}: LeaderboardRowProps) {
  const navigate = useNavigate();
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  const photoUrl = getPlayerHeadshotUrl(player.playerName, 'pga');

  return (
    <button
      onClick={handleTap}
      className="w-full flex items-center group transition-colors duration-200 hover:bg-[rgba(0,0,0,0.015)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ 
        padding: '14px 20px',
        minHeight: '60px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        gap: '10px',
        opacity: 0,
        transform: 'translateY(12px)',
        animation: `fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${animationDelay}s`,
        outlineColor: accent.primary,
      }}
      role="listitem"
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.countryCode}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Rank - text only */}
      <div className="flex-shrink-0" style={{ width: '20px', textAlign: 'center' }}>
        <span 
          style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {player.rank}
        </span>
      </div>

      {/* Avatar - 40px */}
      <div 
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
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
          className="fallback-initials w-full h-full"
          style={{ 
            display: photoUrl ? 'none' : 'flex',
            background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
            transition: 'background 0.3s ease',
          }}
        />
      </div>

      {/* Player Info - CSS ellipsis, no hard truncation */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="m-0"
          style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={player.playerName}
        >
          {player.playerName}
        </p>
        <div className="flex items-center mt-0.5" style={{ gap: '3px' }}>
          <div style={{ width: '12px', height: '8px', borderRadius: '1px' }}>
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
        </div>
      </div>

      {/* Stat Value - monospace */}
      <div className="flex items-baseline flex-shrink-0" style={{ gap: '2px' }}>
        <span style={{ 
          fontSize: '15px', 
          fontWeight: 700, 
          color: '#111827' 
        }}>
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.3)' }}>
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Chevron - visible with hover animation */}
      <ChevronRight 
        size={14} 
        className="flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
        style={{ color: 'rgba(0, 0, 0, 0.3)', marginLeft: '4px' }} 
      />
    </button>
  );
});
