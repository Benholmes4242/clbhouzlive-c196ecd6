/**
 * ChasingPack - #2 and #3 players with delta values
 * 
 * Features:
 * - F1-style delta display (negative values vs leader)
 * - 38px circle avatars
 * - Compact row layout
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface ChasingPackProps {
  players: LeaderboardPlayer[];
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
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
  // For higher is better: delta is negative (player is behind)
  // For lower is better: delta is positive (player is behind)
  const displayDelta = higherIsBetter ? delta : -delta;
  
  // Show more precision for small deltas
  const absValue = Math.abs(displayDelta);
  if (absValue < 0.2 && absValue > 0) {
    return displayDelta.toFixed(2);
  }
  return displayDelta.toFixed(1);
}

const ChaserRow = memo(function ChaserRow({ 
  player, 
  leaderValue, 
  higherIsBetter,
  unit,
  isLast,
}: { 
  player: LeaderboardPlayer; 
  leaderValue: number;
  higherIsBetter: boolean;
  unit: string;
  isLast: boolean;
}) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const delta = formatDelta(player.statValue, leaderValue, higherIsBetter);

  const handleClick = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center transition-colors duration-120 hover:bg-[rgba(0,0,0,0.015)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
      style={{ 
        padding: '10px 0',
        gap: '10px',
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
      }}
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.statDisplayValue} ${unit}`}
    >
      {/* Rank badge - 20x20 gray circle */}
      <div 
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(11,18,32,0.06)',
        }}
      >
        <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(11,18,32,0.45)' }}>
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

      {/* Name + Country */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="truncate m-0"
          style={{ fontSize: '14px', fontWeight: 600, color: '#0B1220' }}
        >
          {player.playerName}
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

      {/* Stat Value + Delta */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-baseline" style={{ gap: '2px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#0B1220' }}>
            {player.statDisplayValue}
          </span>
          {unit && (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(11,18,32,0.3)' }}>
              {unit}
            </span>
          )}
        </div>
        <p 
          className="m-0 mt-0.5"
          style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            color: 'rgba(11,18,32,0.3)',
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
}: ChasingPackProps) {
  if (players.length === 0) return null;

  return (
    <div 
      style={{ 
        borderTop: '1px solid rgba(0,0,0,0.05)',
        padding: '0 16px',
      }}
    >
      {/* Section label */}
      <p 
        className="m-0"
        style={{ 
          padding: '12px 0 6px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(11,18,32,0.3)',
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
        />
      ))}
    </div>
  );
});
