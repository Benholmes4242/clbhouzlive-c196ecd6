/**
 * TourHeroHelpers - Shared primitives for hero glass cards
 * Used by: HeroCarousel (overview) + ScheduleHeroCard (schedule tab)
 */

import React, { useState, useEffect } from 'react';
import type { WinnerStats } from '../../hooks/useWinnerScorecardStats';
import type { WinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { SCORE_COLORS } from '../../utils/scoreColors';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';

/** Score color — live state: pure white (#FFFFFF) matching scrubber fill, regardless of par */
export function getScoreColor(_score: number | null): string {
  return '#FFFFFF';
}

/** Score color for FINISHED state — white to match live leaderboard */
export function getFinishedScoreColor(_score: number | null): string {
  return '#FFFFFF';
}

export function formatPurse(purse: number | null): string {
  if (!purse) return '';
  return purse >= 1_000_000
    ? `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${(purse / 1_000).toFixed(0)}K`;
}

/**
 * Infers current round label. Uses round scores if available (from full leaderboard),
 * falls back to date arithmetic. Exported for use in both hero surfaces.
 */
export function getCurrentRoundLabel(
  roundScores: { round_1?: number | null; round_2?: number | null; round_3?: number | null; round_4?: number | null } | null,
  startDate: string
): string {
  if (roundScores) {
    if (roundScores.round_4 != null) return 'Final Round';
    if (roundScores.round_3 != null) return 'Round 3 of 4';
    if (roundScores.round_2 != null) return 'Round 2 of 4';
    if (roundScores.round_1 != null) return 'Round 1 of 4';
  }
  const dayIndex = Math.max(0, Math.floor(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const round = Math.min(dayIndex + 1, 4);
  return round >= 4 ? 'Final Round' : `Round ${round} of 4`;
}

/**
 * UpcomingCountdown — live countdown to tournament start
 */
export function UpcomingCountdown({ startDate }: { startDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function update() {
      const normalized = startDate.includes('T') ? startDate : `${startDate}T12:00:00`;
      const diff = new Date(normalized).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Starting now'); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m`);
    }
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [startDate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
        Starts in
      </span>
      <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
        {timeLeft}
      </span>
    </div>
  );
}

/** Frosted glass avatar — for use inside dark/photo glass cards */
function FrostedAvatar({ src, displayName, size }: { src: string | null; displayName: string; size: number }) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [imgError, setImgError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const initials = displayName.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  // Reset state when src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setImgError(false);
    setLoaded(false);
  }, [src]);

  const handleLoad = () => {
    setLoaded(true); // Lock in success — ignore subsequent onError
  };

  const handleError = () => {
    if (loaded) return; // Image already loaded successfully — ignore false error
    if (currentSrc && currentSrc !== PLAYER_SILHOUETTE_URL) {
      // First failure: try silhouette
      setCurrentSrc(PLAYER_SILHOUETTE_URL);
    } else {
      // Silhouette also failed: show initials as absolute last resort
      setImgError(true);
    }
  };

  return (
    <div style={{
      width: size, height: size, borderRadius: '34%', overflow: 'hidden', flexShrink: 0,
      border: '1.5px solid rgba(255,255,255,0.18)',
      background: 'rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {currentSrc && !imgError ? (
        <img src={currentSrc} alt={displayName} onLoad={handleLoad} onError={handleError} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: 'rgba(255,255,255,0.80)', lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
}

/** Squircle avatar matching the global SDS spec (34% radius, 1:1.05 aspect) */
export function PlayerAvatar({
  photoUrl,
  pgaTourId,
  displayName,
  fullName,
  headshotOverride,
  tourCode,
  size = 44,
  frosted = false,
}: {
  photoUrl?: string | null;
  pgaTourId?: string | null;
  displayName: string;
  /** Full name for R2 lookup — e.g. "Jacob Bridgeman". Falls back to displayName if omitted. */
  fullName?: string;
  /** Override filename for R2 lookup when full_name doesn't match */
  headshotOverride?: string | null;
  /** Tour code for R2 folder lookup — e.g. 'pga', 'euro', 'lpga', 'liv' */
  tourCode?: string;
  size?: number;
  /** Use frosted glass styling (translucent bg + border) — for glass card contexts */
  frosted?: boolean;
}) {
  // PRIMARY: R2 headshot by full name + tour. FALLBACK: silhouette.
  const nameForLookup = fullName || displayName;
  const resolved = getPlayerHeadshotUrl(nameForLookup, tourCode || 'pga', headshotOverride) || PLAYER_SILHOUETTE_URL;
  const initials = displayName
    .split(/[\s.]/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('') || '?';

  if (frosted) {
    return <FrostedAvatar src={resolved} displayName={displayName} size={size} />;
  }

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
  tourCode,
  onPlayerTap,
}: {
  row: PodiumRow;
  tourCode?: string;
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
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          flexShrink: 0,
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
            fullName={player.fullName}
            tourCode={tourCode}
            size={30}
            frosted
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
                fullName={p.fullName}
                tourCode={tourCode}
                size={26}
                frosted
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
              border: '1.5px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.70)',
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
          style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', minWidth: 0 }}
        >
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.displayName}
          </span>
        </button>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>
            {row.players.length}-way tie
          </span>
        </div>
      )}

      {/* Score — shared for this position */}
      <span
        style={{
          fontSize: isSingle ? 14 : 13,
          fontWeight: isSingle ? 700 : 600,
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
  if (margin === 0) return 'Won in Playoff';
  return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
}

// ─── StatChip ────────────────────────────────────────────────────────────────

export function StatChip({
  value,
  label,
  suffix,
  color,
}: {
  value: string | number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '8px 4px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      minWidth: 0,
    }}>
      <span style={{
        fontSize: 15,
        fontWeight: 700,
        color: color ?? '#FFFFFF',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {value}{suffix && (
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}>{suffix}</span>
        )}
      </span>
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        lineHeight: 1,
        textAlign: 'center',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── WinnerStatsPanel ─────────────────────────────────────────────────────────

export function WinnerStatsPanel({
  tournamentStats,
  seasonStats,
}: {
  tournamentStats: WinnerStats | null | undefined;
  seasonStats: WinnerSeasonStats | null | undefined;
}) {
  const hasTournament = !!tournamentStats;
  const hasSeason = !!(
    seasonStats &&
    (seasonStats.drivingDistance || seasonStats.drivingAccuracy || seasonStats.greensInReg || seasonStats.puttingAverage)
  );

  if (!hasTournament && !hasSeason) return null;

  return (
    <div style={{
      marginTop: 12,
      padding: 0,
    }}>
      {/* Tournament Stats */}
      {hasTournament && (
        <>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.25)',
            marginBottom: 6,
          }}>
            Tournament
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {tournamentStats!.holesInOne > 0 && (
              <StatChip
                value={tournamentStats!.holesInOne}
                label={tournamentStats!.holesInOne === 1 ? 'Hole-in-1' : 'Holes-in-1'}
                color={SCORE_COLORS.eagle.text}
              />
            )}
            {tournamentStats!.eagles > 0 && (
              <StatChip
                value={tournamentStats!.eagles}
                label={tournamentStats!.eagles === 1 ? 'Eagle' : 'Eagles'}
                color={SCORE_COLORS.eagle.text}
              />
            )}
            <StatChip
              value={tournamentStats!.birdies}
              label="Birdies"
              color={SCORE_COLORS.birdie.text}
            />
            <StatChip value={tournamentStats!.pars} label="Pars" />
            {tournamentStats!.bogeys > 0 && (
              <StatChip
                value={tournamentStats!.bogeys}
                label="Bogeys"
                color={SCORE_COLORS.bogey.text}
              />
            )}
          </div>
        </>
      )}

      {/* Season Averages */}
      {hasSeason && (
        <>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.25)',
            marginTop: hasTournament ? 10 : 0,
            marginBottom: 6,
          }}>
            Performance Averages
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {seasonStats!.drivingDistance && (
              <StatChip
                value={Math.round(seasonStats!.drivingDistance)}
                label="Driver"
                suffix="yds"
              />
            )}
            {seasonStats!.drivingAccuracy && (
              <StatChip
                value={Math.round(seasonStats!.drivingAccuracy).toString()}
                label="Fairways"
                suffix="%"
              />
            )}
            {seasonStats!.greensInReg && (
              <StatChip
                value={Math.round(seasonStats!.greensInReg).toString()}
                label="GIR"
                suffix="%"
              />
            )}
            {seasonStats!.puttingAverage && (
              <StatChip
                value={seasonStats!.puttingAverage.toFixed(2)}
                label="Putts"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
