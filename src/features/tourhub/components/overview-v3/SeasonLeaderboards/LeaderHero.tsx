/**
 * LeaderHero - Broadcast Strip Leader Card
 * 
 * Horizontal layout: amber accent bar → avatar → player info → big stat value.
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

export const LeaderHero = memo(function LeaderHero({ player, accentColor }: LeaderHeroProps) {
  const navigate = useNavigate();
  const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
  const accent = CATEGORY_ACCENT_COLORS[accentColor];
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="w-full text-left active:scale-[0.99] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ outlineColor: accent.primary }}
      aria-label={`Season leader: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 16,
          border: '1px solid hsl(var(--border) / 0.5)',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Amber left accent bar */}
        <div style={{ width: 5, flexShrink: 0, background: accent.primary }} />

        {/* Avatar block */}
        <div
          style={{
            width: 88,
            flexShrink: 0,
            overflow: 'hidden',
            background: 'hsl(var(--muted))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showPhoto ? (
            <img
              src={photoUrl}
              alt={player.playerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
              loading="eager"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src={PLAYER_SILHOUETTE_URL}
              alt={player.playerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'hsl(var(--muted))' }}
            />
          )}
        </div>

        {/* Player info */}
        <div
          style={{
            flex: 1,
            padding: '14px 12px 14px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: accent.primary,
              marginBottom: 2,
            }}
          >
            Season Leader
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'hsl(var(--foreground))',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.playerName}
          </div>
          <div style={{ marginTop: 2 }}>
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
        </div>

        {/* Big stat value */}
        <div
          style={{
            padding: '14px 18px 14px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: 'hsl(var(--foreground))',
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}
          >
            {player.statDisplayValue}
          </div>
          {player.statUnit && (
            <div
              style={{
                fontSize: 10,
                color: 'hsl(var(--muted-foreground))',
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              {player.statUnit}
            </div>
          )}
        </div>
      </div>
    </button>
  );
});
