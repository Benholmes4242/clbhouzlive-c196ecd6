/**
 * LeaderboardRow - Individual Row for Ranks 4-10
 * 
 * Features:
 * - 38px circle avatars (not squircles)
 * - Primary color stat values (not blue)
 * - 66px row height
 * - Hover state instead of alternating rows
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  animationDelay: number;
}

function truncateName(name: string, maxLength: number = 14): string {
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
  animationDelay,
}: LeaderboardRowProps) {
  const navigate = useNavigate();

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);

  return (
    <button
      onClick={handleTap}
      className="w-full flex items-center transition-colors duration-120 hover:bg-[rgba(0,0,0,0.015)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
      style={{ 
        padding: '0 14px',
        height: '66px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        gap: '10px',
        opacity: 0,
        transform: 'translateY(8px)',
        animation: `fadeSlideIn 0.2s ease forwards`,
        animationDelay: `${animationDelay}s`,
      }}
      role="listitem"
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.countryCode}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Rank */}
      <div className="flex-shrink-0" style={{ width: '26px' }}>
        <span 
          style={{ 
            fontSize: '13.5px', 
            fontWeight: 700, 
            color: 'rgba(11,18,32,0.28)',
          }}
        >
          {player.rank}
        </span>
      </div>

      {/* Avatar - 38px circle */}
      <div 
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.06)',
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
          className="fallback-initials w-full h-full flex items-center justify-center"
          style={{ 
            display: photoUrl ? 'none' : 'flex',
            background: 'linear-gradient(145deg, #e4e8ed, #d0d6dd)',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(11,18,32,0.5)' }}>
            {player.initials}
          </span>
        </div>
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="m-0 truncate"
          style={{ fontSize: '14px', fontWeight: 600, color: '#0B1220' }}
          title={player.playerName}
        >
          {truncateName(player.playerName)}
        </p>
        <div className="flex items-center mt-0.5" style={{ gap: '3px' }}>
          <div style={{ width: '12px', height: '8px', borderRadius: '1px' }}>
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(11,18,32,0.38)' }}>
            {formatCountryName(player.countryCode)}
          </span>
        </div>
      </div>

      {/* Stat Value */}
      <div className="flex items-baseline flex-shrink-0" style={{ gap: '2px' }}>
        <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#0B1220' }}>
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(11,18,32,0.32)' }}>
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={14} style={{ color: 'rgba(11,18,32,0.14)', flexShrink: 0 }} />
    </button>
  );
});
