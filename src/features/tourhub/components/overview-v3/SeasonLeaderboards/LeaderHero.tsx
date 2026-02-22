/**
 * LeaderHero - Cinematic Champion Spotlight Card
 * 
 * Horizontal split: large avatar left, stats right.
 * Think PGA Tour app / Sky Sports broadcast cards.
 */

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface LeaderHeroProps {
  player: LeaderboardPlayer;
  accentColor: CategoryId;
}

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export const LeaderHero = memo(function LeaderHero({ player, accentColor }: LeaderHeroProps) {
  const navigate = useNavigate();
  const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
  const accent = CATEGORY_ACCENT_COLORS[accentColor];
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="w-full text-left relative overflow-hidden active:scale-[0.99] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        padding: '20px',
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        outlineColor: accent.primary,
      }}
      aria-label={`Season leader: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Clean card — no gradient overlay */}

      {/* Horizontal split: Avatar left, Info right */}
      <div className="relative flex" style={{ gap: '18px' }}>
        {/* LEFT: Large cinematic avatar - edge-to-edge */}
        <div className="flex-shrink-0 -ml-5 -my-5">
          <div
            className="overflow-hidden"
            style={{
              width: '140px',
              height: '100%',
              minHeight: '152px',
              borderRadius: '0',
              borderTopLeftRadius: '20px',
              borderBottomLeftRadius: '20px',
            }}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt={player.playerName}
                className="w-full h-full object-cover"
                loading="eager"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Name, country, stat, label */}
        <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center">
          {/* Player name */}
          <span
            className="block truncate text-foreground"
            style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}
          >
            {player.playerName}
          </span>

          {/* Country — flag only */}
          <div className="flex items-center mt-1">
            <CountryFlag country={player.countryCode} size="sm" />
          </div>

          {/* Stat value */}
          <div className="flex items-baseline justify-center" style={{ marginTop: '12px', gap: '4px' }}>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 800,
                letterSpacing: '-1.5px',
                lineHeight: 1,
                color: 'hsl(var(--foreground))',
              }}
            >
              {player.statDisplayValue}
            </span>
            {player.statUnit && (
              <span
                className="text-muted-foreground"
                style={{ fontSize: '15px', fontWeight: 500, marginLeft: '2px' }}
              >
                {player.statUnit}
              </span>
            )}
          </div>

          {/* "SEASON LEADER" label */}
          <p
            className="m-0"
            style={{
              marginTop: '6px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '1.2px',
              textTransform: 'uppercase' as const,
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            Season Leader
          </p>
        </div>
      </div>
    </button>
  );
});
