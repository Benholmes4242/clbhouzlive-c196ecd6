/**
 * LeaderHero - Premium #1 Leader Card
 * 
 * Features:
 * - Category accent color throughout
 * - Gradient background glow
 * - Monospace stat number in accent color
 * - Premium position badge
 * - Celebratory podium treatment
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderHeroProps {
  player: LeaderboardPlayer;
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

export const LeaderHero = memo(function LeaderHero({ player, accentColor }: LeaderHeroProps) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  const handleClick = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left transition-all duration-200 relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ 
        padding: '24px 20px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${accent.border}`,
        boxShadow: `0 2px 8px ${accent.bgLight}`,
        outlineColor: accent.primary,
      }}
      aria-label={`Rank 1: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Accent gradient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent.bgLight} 0%, transparent 60%)`,
          borderRadius: '16px',
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Row 1: Avatar + Name Block */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          {/* Avatar container with position badge */}
          <div className="relative flex-shrink-0">
            {/* Avatar - 64px with accent border */}
            <div 
              className="overflow-hidden"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                border: `2px solid ${accent.border}`,
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
                  background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
                }}
              >
                <span 
                  style={{ 
                    fontSize: '20px',
                    fontWeight: 700, 
                    color: accent.textMuted,
                  }}
                >
                  {player.initials}
                </span>
              </div>
            </div>

            {/* Position badge - overlapping top-right */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                top: '-6px',
                right: '-6px',
                width: '22px',
                height: '22px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.primary}dd 100%)`,
                border: '2px solid #FFFFFF',
                boxShadow: `0 2px 4px ${accent.shadow}`,
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>1</span>
            </div>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <span 
              className="block truncate"
              style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                letterSpacing: '-0.01em',
                color: '#111827',
              }}
            >
              {player.playerName}
            </span>

            {/* Country */}
            <div className="flex items-center mt-1" style={{ gap: '4px' }}>
              <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                <CountryFlag country={player.countryCode} size="sm" />
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.4)' }}>
                {formatCountryName(player.countryCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Big Stat Number */}
        <div className="flex items-baseline" style={{ marginTop: '16px', gap: '4px' }}>
          <span 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '48px', 
              fontWeight: 800, 
              letterSpacing: '-2px',
              lineHeight: 1,
              color: accent.primary,
              transition: 'color 0.3s ease',
            }}
          >
            {player.statDisplayValue}
          </span>
          {player.statUnit && (
            <span 
              style={{ 
                fontSize: '18px', 
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.3)',
                marginLeft: '4px',
              }}
            >
              {player.statUnit}
            </span>
          )}
        </div>

        {/* Row 3: Sub-label */}
        <p 
          style={{ 
            marginTop: '4px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: accent.textMuted,
            margin: 0,
            transition: 'color 0.3s ease',
          }}
        >
          Season-Leading Average
        </p>
      </div>
    </button>
  );
});
