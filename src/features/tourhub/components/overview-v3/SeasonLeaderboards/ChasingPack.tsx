/**
 * ChasingPack - #2 and #3 players with silver/bronze badges
 * 
 * Features:
 * - Metallic gradient badges for positions
 * - F1-style delta display
 * - Monospace stat values
 * - Category accent for placeholder avatars
 */

import { memo } from 'react';
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

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDelta(playerValue: number, leaderValue: number, higherIsBetter: boolean): string {
  const delta = playerValue - leaderValue;
  const displayDelta = higherIsBetter ? delta : -delta;
  
  const absValue = Math.abs(displayDelta);
  if (absValue < 0.2 && absValue > 0) {
    return displayDelta.toFixed(2);
  }
  return displayDelta.toFixed(1);
}

// Position badge gradients
const POSITION_BADGES = {
  2: {
    background: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)',
    label: 'Silver',
  },
  3: {
    background: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)',
    label: 'Bronze',
  },
};

const ChaserRow = memo(function ChaserRow({ 
  player, 
  leaderValue, 
  higherIsBetter,
  unit,
  isLast,
  accentColor,
}: { 
  player: LeaderboardPlayer; 
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
  isLast: boolean;
  accentColor: CategoryId;
}) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const delta = formatDelta(player.statValue, leaderValue, higherIsBetter);
  const accent = CATEGORY_ACCENT_COLORS[accentColor];
  const positionBadge = POSITION_BADGES[player.rank as 2 | 3];

  const handleClick = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center transition-colors duration-200 hover:bg-[rgba(0,0,0,0.015)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ 
        padding: '10px 0',
        gap: '10px',
        borderBottom: isLast ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
        outlineColor: accent.primary,
      }}
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.statDisplayValue} ${unit}`}
    >
      {/* Position badge - silver/bronze gradient */}
      <div 
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '7px',
          background: positionBadge?.background || 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>
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
          className="fallback-initials w-full h-full flex items-center justify-center"
          style={{ 
            display: photoUrl ? 'none' : 'flex',
            background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 700, color: accent.textMuted }}>
            {player.initials}
          </span>
        </div>
      </div>

      {/* Name + Country */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="truncate m-0"
          style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}
        >
          {player.playerName}
        </p>
        <div className="flex items-center mt-0.5" style={{ gap: '3px' }}>
          <div style={{ width: '12px', height: '8px', borderRadius: '1px' }}>
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.35)' }}>
            {formatCountryName(player.countryCode)}
          </span>
        </div>
      </div>

      {/* Stat Value + Delta */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-baseline" style={{ gap: '2px', justifyContent: 'flex-end' }}>
          <span style={{ 
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#111827' 
          }}>
            {player.statDisplayValue}
          </span>
          {unit && (
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.3)' }}>
              {unit}
            </span>
          )}
        </div>
        <p 
          className="m-0 mt-0.5"
          style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            color: 'rgba(0, 0, 0, 0.3)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {delta}
        </p>
      </div>
    </button>
  );
});

export const ChasingPack = memo(function ChasingPack({ 
  players, 
  leaderValue, 
  higherIsBetter,
  unit,
  accentColor,
}: ChasingPackProps) {
  if (players.length === 0) return null;

  return (
    <div 
      style={{ 
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        marginTop: '20px',
        paddingTop: '16px',
        padding: '16px 20px 0',
      }}
    >
      {/* Section label - title case */}
      <p 
        className="m-0"
        style={{ 
          marginBottom: '10px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: 'rgba(0, 0, 0, 0.35)',
        }}
      >
        Chasing Pack
      </p>

      {/* Player rows */}
      {players.map((player, index) => (
        <ChaserRow
          key={player.playerId}
          player={player}
          leaderValue={leaderValue}
          higherIsBetter={higherIsBetter}
          unit={unit}
          isLast={index === players.length - 1}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
});
