/**
 * ChasingPack - Horizontal scrolling chaser cards (positions #2–#6)
 *
 * Compact portrait cards in a scrollable strip.
 */

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface ChasingPackProps {
  players: LeaderboardPlayer[];
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
  accentColor: CategoryId;
}

function formatDelta(playerValue: number, leaderValue: number, higherIsBetter: boolean): string {
  const delta = playerValue - leaderValue;
  const displayDelta = higherIsBetter ? delta : -delta;
  const absValue = Math.abs(displayDelta);
  if (absValue < 0.2 && absValue > 0) return displayDelta.toFixed(2);
  return displayDelta.toFixed(1);
}

const ChaserCard = memo(function ChaserCard({
  player, leaderValue, higherIsBetter, unit, accentColor,
}: {
  player: LeaderboardPlayer;
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
  accentColor: CategoryId;
}) {
  const navigate = useNavigate();
  const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
  const delta = formatDelta(player.statValue, leaderValue, higherIsBetter);
  const accent = CATEGORY_ACCENT_COLORS[accentColor];
  const [imgError, setImgError] = useState(false);
  const showPhoto = photoUrl && !imgError;

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex-shrink-0 active:scale-[0.97] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: 108,
        padding: '12px 12px 10px',
        background: 'hsl(var(--card))',
        borderRadius: 14,
        border: '1px solid hsl(var(--border) / 0.5)',
        outlineColor: accent.primary,
        textAlign: 'center',
      }}
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.statDisplayValue} ${unit}`}
    >
      {/* Rank + flag */}
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
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '34%',
          overflow: 'hidden',
          marginBottom: 8,
          margin: '0 auto 8px',
          background: 'hsl(var(--muted))',
        }}
      >
        {showPhoto ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={PLAYER_SILHOUETTE_URL}
            alt={player.playerName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
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

      {/* Delta to leader */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'hsl(var(--muted-foreground))',
          marginTop: 3,
        }}
      >
        {delta} to lead
      </div>
    </button>
  );
});

export const ChasingPack = memo(function ChasingPack({
  players, leaderValue, higherIsBetter, unit, accentColor,
}: ChasingPackProps) {
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
          <ChaserCard
            key={player.playerId}
            player={player}
            leaderValue={leaderValue}
            higherIsBetter={higherIsBetter}
            unit={unit}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
});
