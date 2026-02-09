/**
 * ChasingPack - #2 and #3 as horizontal scroll cards
 * 
 * Smaller, flatter cards showing:
 * - Rank, name + flag, stat value, gap to leader
 * "Creates pressure without clutter"
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

function formatDelta(playerValue: number, leaderValue: number, higherIsBetter: boolean): string {
  const delta = playerValue - leaderValue;
  const displayDelta = higherIsBetter ? delta : -delta;
  const absValue = Math.abs(displayDelta);
  if (absValue < 0.2 && absValue > 0) return displayDelta.toFixed(2);
  return displayDelta.toFixed(1);
}

const POSITION_BADGES: Record<number, { background: string }> = {
  2: { background: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)' },
  3: { background: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)' },
};

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
  const badge = POSITION_BADGES[player.rank];

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex-shrink-0 text-left active:scale-[0.97] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: 'calc(50% - 6px)',
        minWidth: '160px',
        padding: '14px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.06)',
        outlineColor: accent.primary,
      }}
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.statDisplayValue} ${unit}`}
    >
      {/* Top row: Badge + Avatar + Name */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        {/* Position badge */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '20px', height: '20px', borderRadius: '7px',
            background: badge?.background || 'rgba(0,0,0,0.1)',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>{player.rank}</span>
        </div>

        {/* Avatar */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          {photoUrl ? (
            <img
              src={photoUrl} alt={player.playerName}
              className="w-full h-full object-cover" loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                if (fb) (fb as HTMLElement).style.display = 'flex';
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
            <span style={{ fontSize: '13px', fontWeight: 700, color: accent.textMuted }}>
              {player.initials}
            </span>
          </div>
        </div>

        {/* Name + flag */}
        <div className="flex-1 min-w-0">
          <p className="m-0 truncate" style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {player.lastName}
          </p>
          <div className="flex items-center mt-0.5" style={{ gap: '3px' }}>
            <div style={{ width: '12px', height: '8px', borderRadius: '1px' }}>
              <CountryFlag country={player.countryCode} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat value */}
      <div className="flex items-baseline mt-3" style={{ gap: '2px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '20px', fontWeight: 700, color: 'hsl(var(--foreground))',
        }}>
          {player.statDisplayValue}
        </span>
        {unit && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Gap to leader */}
      <p className="m-0 mt-1" style={{
        fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {delta} to lead
      </p>
    </button>
  );
});

export const ChasingPack = memo(function ChasingPack({
  players, leaderValue, higherIsBetter, unit, accentColor,
}: ChasingPackProps) {
  if (players.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Section label */}
      <p className="m-0 px-4 mb-2" style={{
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'hsl(var(--muted-foreground))',
      }}>
        The Chasers
      </p>

      {/* Horizontal scroll of cards */}
      <div
        className="flex overflow-x-auto scrollbar-hide px-4"
        style={{ gap: '12px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
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