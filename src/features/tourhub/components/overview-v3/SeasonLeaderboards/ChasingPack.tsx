/**
 * ChasingPack - #2 and #3 as side-by-side cards
 * 
 * Horizontal split per card: avatar left, stats right.
 * Creates pressure without clutter.
 */

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

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
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const delta = formatDelta(player.statValue, leaderValue, higherIsBetter);
  const accent = CATEGORY_ACCENT_COLORS[accentColor];
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex-shrink-0 text-left active:scale-[0.97] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: 'calc(50% - 6px)',
        minWidth: '160px',
        padding: '12px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.06)',
        outlineColor: accent.primary,
      }}
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.statDisplayValue} ${unit}`}
    >
      {/* Horizontal split: Avatar left, info right */}
      <div className="flex" style={{ gap: '10px' }}>
        {/* LEFT: Avatar */}
        <div className="flex-shrink-0">
          <div
            className="overflow-hidden"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt={player.playerName}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 700, color: accent.textMuted }}>
                  {player.initials}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Rank, name, country, stat, gap */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Rank + Name */}
          <div className="flex items-center" style={{ gap: '4px' }}>
            <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              #{player.rank}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>·</span>
            <span className="truncate text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>
              {player.lastName}
            </span>
          </div>

          {/* Country — flag + name inline */}
          <div className="flex items-center mt-0.5" style={{ gap: '4px' }}>
            <CountryFlag country={player.countryCode} size="sm" />
            <span className="text-muted-foreground truncate" style={{ fontSize: '11px', lineHeight: 1 }}>
              {player.countryCode ? player.countryCode.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''}
            </span>
          </div>

          {/* Stat value */}
          <div className="flex items-baseline mt-1.5" style={{ gap: '2px' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '18px',
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                lineHeight: 1,
              }}
            >
              {player.statDisplayValue}
            </span>
            {unit && (
              <span className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 500 }}>
                {unit}
              </span>
            )}
          </div>

          {/* Gap to leader */}
          <p className="m-0 text-muted-foreground" style={{ fontSize: '10px', fontWeight: 500, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
            {delta} to lead
          </p>
        </div>
      </div>
    </button>
  );
});

export const ChasingPack = memo(function ChasingPack({
  players, leaderValue, higherIsBetter, unit, accentColor,
}: ChasingPackProps) {
  if (players.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Section label */}
      <p className="m-0 text-muted-foreground" style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        The Chasers
      </p>

      {/* Side-by-side cards */}
      <div className="flex" style={{ gap: '12px' }}>
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
