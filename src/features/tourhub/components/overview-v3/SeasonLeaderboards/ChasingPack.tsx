/**
 * ChasingPack - Horizontal scrolling chaser cards
 * 
 * Compact cards showing rank, flag, avatar, last name, and stat value.
 */

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import { PlayerAvatar } from '@/features/tourhub/components/PlayerAvatar';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';

interface ChasingPackProps {
  players: LeaderboardPlayer[];
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
  accentColor: CategoryId;
}

export const ChasingPack = memo(function ChasingPack({
  players, leaderValue, higherIsBetter, unit, accentColor,
}: ChasingPackProps) {
  const navigate = useNavigate();
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  if (players.length === 0) return null;

  return (
    <div>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        The Chasers
      </p>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 2,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {players.map((player) => (
          <button
            key={player.playerId}
            onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
            style={{
              flexShrink: 0,
              width: 112,
              background: 'hsl(var(--card))',
              borderRadius: 14,
              border: '1px solid hsl(var(--border) / 0.5)',
              padding: '12px 12px 10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s',
            }}
            className="active:scale-[0.97]"
          >
            {/* Rank + flag row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                #{player.rank}
              </span>
              <CountryFlag country={player.countryCode} size="sm" />
            </div>

            {/* Avatar */}
            <div style={{ marginBottom: 8 }}>
              <PlayerAvatar
                playerId={player.playerId}
                playerName={player.playerName}
                tourCode={player.tourCode ?? 'pga'}
                size="md"
              />
            </div>

            {/* Last name */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                lineHeight: 1.3,
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {player.playerName.split(' ').slice(-1)[0]}
            </div>

            {/* Stat value */}
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: accent.primary,
                letterSpacing: '-0.5px',
              }}
            >
              {player.statDisplayValue}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
