/**
 * ScheduleTournamentCard - Clean list-row design matching WhatsComing EventRow
 * 
 * Design: Date block + context label + name + venue + leader/winner
 * Dark-mode safe: all colors use semantic tokens
 * Tappable player/venue names with stopPropagation
 * Score color-coded (green/red/neutral)
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { getContextLabel } from '../../utils/tournamentClassification';
import { TOUR_COLORS } from '../../constants/colors';
import { getCurrentRound } from '../../utils/formatThruDisplay';
import { formatPurse } from '../shared/TourHeroHelpers';

// B42 FIX 11: removed batchImageUrl prop
interface ScheduleTournamentCardProps {
  tournament: TourTournament | SeasonTournament;
  className?: string;
  compact?: boolean;
  leaderWinner?: TournamentLeaderWinner;
}

function isSeasonTournament(t: TourTournament | SeasonTournament): t is SeasonTournament {
  return 'startDate' in t;
}

function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return String(d.getUTCDate());
}

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'hsl(var(--muted-foreground))';
  if (score < 0) return '#F7931E';
  if (score > 0) return '#EF4444';
  return 'hsl(var(--muted-foreground))';
}

export function ScheduleTournamentCard({ 
  tournament, 
  className, 
  compact = false, 
  leaderWinner, 
}: ScheduleTournamentCardProps) {
  const navigate = useNavigate();

  const venueName = isSeasonTournament(tournament) ? tournament.venueName : tournament.venue_name;
  const venueCity = isSeasonTournament(tournament) ? tournament.venueCity : tournament.venue_city;
  const startDate = isSeasonTournament(tournament) ? tournament.startDate : tournament.start_date;
  const tourName = isSeasonTournament(tournament) ? tournament.tourName : tournament.tour_full_name;
  
  const winnerFirstName = isSeasonTournament(tournament) ? tournament.winnerFirstName : null;
  const winnerLastName = isSeasonTournament(tournament) ? tournament.winnerLastName : null;
  
  const isFinal = tournament.status === 'closed' || tournament.status === 'complete';
  const isLive = tournament.status === 'inprogress';
  
  const contextLabel = getContextLabel({ name: tournament.name, tourName: tourName ?? undefined });
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT';
  const isRolex = contextLabel === 'ROLEX SERIES';
  
  const venue = [venueName, venueCity].filter(Boolean).join(' · ');

  const hasSeasonWinner = winnerFirstName && winnerLastName && isFinal;
  const hasLeaderWinnerData = leaderWinner && isFinal;
  const hasLeaderData = leaderWinner && isLive;
  
  const winnerDisplay = hasSeasonWinner 
    ? `${winnerFirstName?.charAt(0)}. ${winnerLastName}`
    : hasLeaderWinnerData ? leaderWinner!.displayName : null;

  // B45 FIX 4: always use leaderWinner score when available
  const winnerScore = leaderWinner?.score ?? null;
  const winnerDisplayScore = leaderWinner?.displayScore ?? null;

  // B45 FIX 6: show end date for completed tournaments
  const displayDate = isFinal
    ? (isSeasonTournament(tournament) ? tournament.endDate : (tournament as TourTournament).end_date)
    : startDate;

  const handlePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const playerId = leaderWinner?.playerId;
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  const handleVenueTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venueName) navigate(`/courses?q=${encodeURIComponent(venueName)}`);
  };

  // Build aria-label
  const ariaLabel = [
    tournament.name,
    isLive ? 'live' : isFinal ? 'completed' : 'upcoming',
    isLive && leaderWinner ? `leader ${leaderWinner.displayName} at ${leaderWinner.displayScore}` : null,
    isFinal && winnerDisplay ? `winner ${winnerDisplay}` : null,
    venueName ? `at ${venueName}` : null,
  ].filter(Boolean).join(', ');

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className={`w-full flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border border-border/50 text-left transition-all active:scale-[0.98] ${className || ''}`}
      style={{
        borderLeftWidth: (isLive || isMajor || isSignature || isRolex) ? '3px' : undefined,
        borderLeftColor: isLive
          ? TOUR_COLORS.liveGreen
          : isMajor
          ? TOUR_COLORS.liveAmber
          : (isSignature || isRolex)
          ? 'rgba(16, 185, 129, 0.8)'
          : undefined,
      }}
      whileTap={{ scale: 0.98 }}
      aria-label={ariaLabel}
    >
      {/* Date block — B45 FIX 6: use displayDate */}
      <div className="flex-shrink-0 w-12 text-center">
        <p className="uppercase leading-none text-muted-foreground/70" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>
          {getMonthAbbr(displayDate)}
        </p>
        <p className="leading-none mt-0.5 text-foreground" style={{ fontSize: '20px', fontWeight: 700 }}>
          {getDayNum(displayDate)}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Context label */}
        <div className="flex items-center gap-1.5">
          <p
            className="uppercase leading-none"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: isMajor ? TOUR_COLORS.liveAmber : (isSignature || isRolex) ? 'rgba(16, 185, 129, 0.9)' : isLive ? TOUR_COLORS.liveGreen : 'hsl(var(--muted-foreground) / 0.7)',
            }}
          >
            {isLive ? '● LIVE' : contextLabel}
          </p>
          {/* B44 FIX 7: round label on live list card */}
          {isLive && leaderWinner?.round1 !== undefined && (() => {
            const roundInfo = getCurrentRound(
              leaderWinner!.round1, leaderWinner!.round2, 
              leaderWinner!.round3, leaderWinner!.round4
            );
            return roundInfo ? (
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'hsl(var(--muted-foreground) / 0.6)', letterSpacing: '0.03em' }}>
                R{roundInfo.currentRound}
              </span>
            ) : null;
          })()}
        </div>
        
        {/* Tournament name */}
        <p
          className="mt-1 line-clamp-1 text-foreground"
          style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.15px' }}
        >
          {tournament.name}
        </p>
        
        {/* Winner/Leader row */}
        {(winnerDisplay || hasLeaderData) && (
          <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: '13px', fontWeight: 500 }}>
            {isFinal && winnerDisplay && (
              <span className="text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 inline mr-0.5" style={{ color: TOUR_COLORS.liveAmber }} />
                <button
                  onClick={handlePlayerTap}
                  className="transition-opacity active:opacity-70 inline font-semibold"
                >
                  {winnerDisplay}
                </button>
                {/* B45 FIX 4+5: use winnerDisplayScore + semantic color */}
                {winnerDisplayScore && (
                  <span className="font-semibold ml-1" style={{ color: TOUR_COLORS.liveAmber }}>
                    ({winnerDisplayScore})
                  </span>
                )}
              </span>
            )}
            {hasLeaderData && !isFinal && (
              <span style={{ color: TOUR_COLORS.liveGreen }}>
                Leader:{' '}
                <button
                  onClick={handlePlayerTap}
                  className="transition-opacity active:opacity-70 inline"
                >
                  {leaderWinner!.displayName}
                </button>
                <span className="font-semibold ml-1" style={{ color: getScoreColor(leaderWinner!.score) }}>
                  {leaderWinner!.displayScore}
                </span>
              </span>
            )}
          </p>
        )}

        {/* B43 FIX 8: date range + purse secondary line for upcoming */}
        {!isLive && !isFinal && (() => {
          const endDate = isSeasonTournament(tournament)
            ? null
            : (tournament as TourTournament).end_date;
          const purse = isSeasonTournament(tournament)
            ? null
            : (tournament as TourTournament).purse;

          const parts = [
            endDate && (() => {
              const s = new Date(startDate + 'T12:00:00');
              const e = new Date(endDate + 'T12:00:00');
              const sameMonth = s.getMonth() === e.getMonth();
              return sameMonth
                ? `${getMonthAbbr(startDate)} ${getDayNum(startDate)}–${getDayNum(endDate)}`
                : `${getMonthAbbr(startDate)} ${getDayNum(startDate)} – ${getMonthAbbr(endDate)} ${getDayNum(endDate)}`;
            })(),
            purse && formatPurse(purse),
          ].filter(Boolean);

          return parts.length > 0 ? (
            <p className="mt-0.5 text-muted-foreground/60 line-clamp-1" style={{ fontSize: '12px', fontWeight: 500 }}>
              {parts.join(' · ')}
            </p>
          ) : null;
        })()}
        
        {/* Venue (tappable) */}
        {venue && !compact && (
          <button
            onClick={handleVenueTap}
            className="flex items-center gap-1 mt-0.5 text-muted-foreground transition-opacity active:opacity-70"
            style={{ fontSize: '13px', fontWeight: 400 }}
          >
            <MapPin className="w-3 h-3 flex-shrink-0 opacity-60" />
            <span className="line-clamp-1">{venue}</span>
          </button>
        )}
      </div>
    </motion.button>
  );
}

export function prefetchTournamentImages(_tournaments: (TourTournament | SeasonTournament)[]) {
  // No-op: list view no longer uses course images
}
