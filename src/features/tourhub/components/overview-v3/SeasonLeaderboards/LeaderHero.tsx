/**
 * LeaderHero - The leader block at top of unified card
 * 
 * Features:
 * - 64px circle avatar with green border
 * - 20x20 black rank badge inline before name
 * - Large stat number as focal point
 * - No gold/podium visuals
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderHeroProps {
  player: LeaderboardPlayer;
}

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const LeaderHero = memo(function LeaderHero({ player }: LeaderHeroProps) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);

  const handleClick = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left transition-colors duration-120 hover:bg-[rgba(0,0,0,0.015)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
      style={{ padding: '18px 16px 14px' }}
      aria-label={`Rank 1: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Row 1: Avatar + Name Block */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {/* Avatar - 64px circle */}
        <div 
          className="relative overflow-hidden flex-shrink-0"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2.5px solid rgba(22,90,50,0.15)',
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.playerName}
              className="w-full h-full object-cover"
              loading="eager"
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
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span 
              style={{ 
                fontSize: '22px', // ~34% of 64px
                fontWeight: 700, 
                color: 'rgba(11,18,32,0.5)' 
              }}
            >
              {player.initials}
            </span>
          </div>
        </div>

        {/* Name block */}
        <div className="flex-1 min-w-0">
          {/* Name with inline rank badge */}
          <div className="flex items-center" style={{ gap: '6px' }}>
            {/* Rank badge - 20x20 black circle */}
            <div 
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0B1220',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF' }}>1</span>
            </div>
            
            <span 
              className="truncate"
              style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                letterSpacing: '-0.01em',
                color: '#0B1220',
              }}
            >
              {player.playerName}
            </span>
          </div>

          {/* Country */}
          <div className="flex items-center mt-1" style={{ gap: '3px' }}>
            <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
              <CountryFlag country={player.countryCode} size="sm" />
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(11,18,32,0.42)' }}>
              {formatCountryName(player.countryCode)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Big Stat Number */}
      <div className="flex items-baseline" style={{ marginTop: '14px', gap: '4px' }}>
        <span 
          style={{ 
            fontSize: '42px', 
            fontWeight: 800, 
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: '#0B1220',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span 
            style={{ 
              fontSize: '16px', 
              fontWeight: 500,
              color: 'rgba(11,18,32,0.32)',
            }}
          >
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Row 3: Sub-label */}
      <p 
        style={{ 
          marginTop: '5px',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(11,18,32,0.3)',
          margin: 0,
        }}
      >
        Season-Leading Average
      </p>
    </button>
  );
});
