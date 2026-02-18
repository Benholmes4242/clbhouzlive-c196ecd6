/**
 * TourHeroHelpers - Shared primitives for hero glass cards
 * Used by: HeroCarousel (overview) + ScheduleHeroCard (schedule tab)
 */

import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';

/** Score color for LIVE state only — green under par, red over par */
export function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.7)';
  if (score < 0) return '#22C55E';
  if (score > 0) return '#EF4444';
  return 'rgba(255,255,255,0.7)';
}

/**
 * Score color for FINISHED state — amber matches the 'FINISHED' badge.
 * Under par: amber. Even/over par: dimmed white.
 */
export function getFinishedScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.55)';
  if (score < 0) return '#FACC15';
  if (score > 0) return 'rgba(255,255,255,0.55)';
  return 'rgba(255,255,255,0.55)';
}

export function formatPurse(purse: number | null): string {
  if (!purse) return '';
  return purse >= 1_000_000
    ? `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${(purse / 1_000).toFixed(0)}K`;
}

/** Squircle avatar matching the global SDS spec (34% radius, 1:1.05 aspect) */
export function PlayerAvatar({
  photoUrl,
  pgaTourId,
  displayName,
  size = 44,
}: {
  photoUrl: string | null;
  pgaTourId?: string | null;
  displayName: string;
  size?: number;
}) {
  const resolved = resolvePhotoUrl(photoUrl, pgaTourId);
  const initials = displayName
    .split(/[\s.]/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('') || '?';

  return (
    <SquircleAvatar
      size={size}
      src={resolved}
      alt={displayName}
      fallback={initials}
      hideRing
    />
  );
}

/** Compact runner-up row (positions 2–3) — finished state uses amber scores */
export function RunnerUpRow({
  finisher,
  isTied = false,
  onPlayerTap,
}: {
  finisher: TournamentFinisher;
  isTied?: boolean;
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
      {/* Position — "T2" for ties, "2" for clean */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.40)',
          width: 20,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {isTied ? `T${finisher.position}` : finisher.position}
      </span>

      {/* Avatar */}
      <button onClick={handleTap} className="transition-opacity active:opacity-70" style={{ flexShrink: 0 }}>
        <PlayerAvatar
          photoUrl={finisher.photoUrl}
          pgaTourId={finisher.pgaTourId}
          displayName={finisher.displayName}
          size={26}
        />
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

      {/* Score — amber for under par in finished state */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: getFinishedScoreColor(finisher.score),
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
  winnerPosition?: number,
  runnerUpPosition?: number,
): string | null {
  if (winnerScore === null || runnerUpScore === null) return null;
  // Co-winners — both at position 1
  if (winnerPosition !== undefined && runnerUpPosition !== undefined && winnerPosition === runnerUpPosition) {
    return 'Co-winners';
  }
  const margin = runnerUpScore - winnerScore;
  if (margin === 0) return 'Won in playoff';
  return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
}
