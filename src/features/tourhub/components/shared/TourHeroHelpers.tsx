/**
 * TourHeroHelpers - Shared primitives for hero glass cards
 * Used by: HeroCarousel (overview) + ScheduleHeroCard (schedule tab)
 */

import React, { useState } from 'react';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';

/** Canonical score color — green under par, red over par, neutral even */
export function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.7)';
  if (score < 0) return '#22C55E';
  if (score > 0) return '#EF4444';
  return 'rgba(255,255,255,0.7)';
}

export function formatPurse(purse: number | null): string {
  if (!purse) return '';
  return purse >= 1_000_000
    ? `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${(purse / 1_000).toFixed(0)}K`;
}

/** Circle avatar — photo with initials fallback */
export function PlayerAvatar({
  photoUrl,
  displayName,
  size = 44,
}: {
  photoUrl: string | null;
  displayName: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = displayName
    .split(/[\s.]/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
  const fontSize = size <= 28 ? 10 : 14;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1.5px solid rgba(255,255,255,0.25)',
        background: 'rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ fontSize, fontWeight: 700, color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>
          {initials || '?'}
        </span>
      )}
    </div>
  );
}

/** Compact runner-up row (positions 2–3) */
export function RunnerUpRow({
  finisher,
  onPlayerTap,
}: {
  finisher: TournamentFinisher;
  onPlayerTap?: (e: React.MouseEvent) => void;
}) {
  const handleTap = onPlayerTap ?? ((e: React.MouseEvent) => e.stopPropagation());
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 5,
        paddingBottom: 5,
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Position */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.40)',
          width: 14,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {finisher.position}
      </span>

      {/* Avatar */}
      <button onClick={handleTap} className="transition-opacity active:opacity-70">
        <PlayerAvatar photoUrl={finisher.photoUrl} displayName={finisher.displayName} size={26} />
      </button>

      {/* Name */}
      <button
        onClick={handleTap}
        className="flex-1 text-left transition-opacity active:opacity-70"
        style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.72)', minWidth: 0 }}
      >
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {finisher.displayName}
        </span>
      </button>

      {/* Score */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: getScoreColor(finisher.score),
          flexShrink: 0,
        }}
      >
        {finisher.displayScore || 'E'}
      </span>
    </div>
  );
}

/** Calculate winning margin string from top finishers */
export function calcWinningMargin(
  winnerScore: number | null,
  runnerUpScore: number | null,
): string | null {
  if (winnerScore === null || runnerUpScore === null) return null;
  const margin = runnerUpScore - winnerScore;
  if (margin === 0) return 'Won in playoff';
  return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
}
