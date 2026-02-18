/**
 * TourHeroHelpers - Shared primitives for hero glass cards
 * Used by: HeroCarousel (overview) + ScheduleHeroCard (schedule tab)
 */

import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';

/** Score color — live state: pure white (#FFFFFF) matching scrubber fill, regardless of par */
export function getScoreColor(_score: number | null): string {
  return '#FFFFFF';
}

/** Score color for FINISHED state — all scores use #FACC15 (matches FINISHED badge + trophy) */
export function getFinishedScoreColor(_score: number | null): string {
  return '#FACC15';
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

// ─── Podium Row Types & Builder ───────────────────────────────────────────────

export interface PodiumRow {
  position: number;
  players: TournamentFinisher[];
  isTied: boolean;
  sharedScore: number | null;
  sharedDisplayScore: string | null;
}

/** Groups allFetched finishers by distinct position, returns up to 3 rows. */
export function buildPodiumRows(allFetched: TournamentFinisher[]): PodiumRow[] {
  if (allFetched.length === 0) return [];
  const distinctPositions = [...new Set(allFetched.map(f => f.position))].sort((a, b) => a - b);
  return distinctPositions.slice(0, 3).map(pos => {
    const players = allFetched.filter(f => f.position === pos);
    return {
      position: pos,
      players,
      isTied: players.length > 1,
      sharedScore: players[0].score ?? null,
      sharedDisplayScore: players[0].displayScore ?? null,
    };
  });
}

// ─── PodiumRunnerRow — one row per distinct position ──────────────────────────

export function PodiumRunnerRow({
  row,
  onPlayerTap,
}: {
  row: PodiumRow;
  onPlayerTap?: (playerId: string | null | undefined) => (e: React.MouseEvent) => void;
}) {
  const isSingle = row.players.length === 1;
  const player = row.players[0];
  const shownAvatars = row.players.slice(0, 5);
  const moreCount = row.players.length - shownAvatars.length;

  const noop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

      {/* Position label */}
      <span
        style={{
          minWidth: 24,
          fontSize: row.isTied ? 10 : 12,
          fontWeight: 600,
          color: row.isTied ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          flexShrink: 0,
          ...(row.isTied ? {
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '2px 5px',
            letterSpacing: 0.3,
          } : {}),
        }}
      >
        {row.isTied ? `T${row.position}` : row.position}
      </span>

      {/* Avatar section */}
      {isSingle ? (
        <button
          onClick={onPlayerTap?.(player.playerId) ?? noop}
          className="transition-opacity active:opacity-70"
          style={{ flexShrink: 0 }}
        >
          <PlayerAvatar
            photoUrl={player.photoUrl}
            pgaTourId={player.pgaTourId}
            displayName={player.displayName}
            size={26}
          />
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {shownAvatars.map((p, i) => (
            <div
              key={p.playerId || i}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                position: 'relative',
                zIndex: shownAvatars.length - i,
                flexShrink: 0,
              }}
            >
              <PlayerAvatar
                photoUrl={p.photoUrl}
                pgaTourId={p.pgaTourId}
                displayName={p.displayName}
                size={26}
              />
            </div>
          ))}
          {moreCount > 0 && (
            <div style={{
              marginLeft: -6,
              zIndex: 1,
              width: 22,
              height: 22,
              borderRadius: '34%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              flexShrink: 0,
            }}>
              +{moreCount}
            </div>
          )}
        </div>
      )}

      {/* Name — only for single-player rows */}
      {isSingle ? (
        <button
          onClick={onPlayerTap?.(player.playerId) ?? noop}
          className="flex-1 text-left transition-opacity active:opacity-70"
          style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.72)', minWidth: 0 }}
        >
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.displayName}
          </span>
        </button>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.40)' }}>
            {row.players.length} players tied
          </span>
        </div>
      )}

      {/* Score — shared for this position */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: getFinishedScoreColor(row.sharedScore),
          flexShrink: 0,
        }}
      >
        {row.sharedDisplayScore || 'E'}
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
