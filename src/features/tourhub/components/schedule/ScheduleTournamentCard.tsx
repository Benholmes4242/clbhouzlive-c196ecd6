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

interface ScheduleTournamentCardProps {
  tournament: TourTournament | SeasonTournament;
  className?: string;
  compact?: boolean;
  leaderWinner?: TournamentLeaderWinner;
  batchImageUrl?: string | null;
}

function isSeasonTournament(t: TourTournament | SeasonTournament): t is SeasonTournament {
  return 'startDate' in t;
}

const MAJOR_KEYWORDS = ['masters', 'u.s. open', 'us open', 'open championship', 'pga championship'];
const SIGNATURE_KEYWORDS = ['invitational', 'genesis', 'arnold palmer', 'memorial', 'players'];
const PLAYOFF_KEYWORDS = ['playoff', 'tour championship', 'fedexcup'];

function getContextLabel(name: string, tourName?: string): string {
  const nameLower = name.toLowerCase();
  if (MAJOR_KEYWORDS.some(k => nameLower.includes(k))) return 'MAJOR CHAMPIONSHIP';
  if (PLAYOFF_KEYWORDS.some(k => nameLower.includes(k))) return 'PLAYOFF EVENT';
  if (SIGNATURE_KEYWORDS.some(k => nameLower.includes(k))) return 'SIGNATURE EVENT';
  return `${(tourName || 'TOUR').toUpperCase()} EVENT`;
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
  if (score < 0) return '#22C55E';
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
  
  const contextLabel = getContextLabel(tournament.name, tourName ?? undefined);
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT';
  
  const venue = [venueName, venueCity].filter(Boolean).join(' · ');

  const hasSeasonWinner = winnerFirstName && winnerLastName && isFinal;
  const hasLeaderWinnerData = leaderWinner && isFinal;
  const hasLeaderData = leaderWinner && isLive;
  
  const winnerDisplay = hasSeasonWinner 
    ? `${winnerFirstName?.charAt(0)}. ${winnerLastName}`
    : hasLeaderWinnerData ? leaderWinner!.displayName : null;

  const winnerScore = hasSeasonWinner 
    ? (tournament as any).winnerScore 
    : hasLeaderWinnerData ? leaderWinner?.score : null;

  const handlePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const playerId = leaderWinner?.playerId;
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  const handleVenueTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venueName) navigate(`/tourhub/courses?q=${encodeURIComponent(venueName)}`);
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
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border border-border/50 text-left transition-all active:scale-[0.98] ${className || ''}`}
      style={{
        borderLeftWidth: (isMajor || isSignature) ? '3px' : undefined,
        borderLeftColor: isMajor ? 'hsl(142, 76%, 36%)' : isSignature ? '#f59e0b' : undefined,
      }}
      whileTap={{ scale: 0.98 }}
      aria-label={ariaLabel}
    >
      {/* Date block */}
      <div className="flex-shrink-0 w-12 text-center">
        <p className="uppercase leading-none text-muted-foreground/70" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em' }}>
          {getMonthAbbr(startDate)}
        </p>
        <p className="leading-none mt-0.5 text-foreground" style={{ fontSize: '17px', fontWeight: 700 }}>
          {getDayNum(startDate)}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Context label */}
        <div className="flex items-center gap-1.5">
          <p
            className="uppercase leading-none"
            style={{
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: isMajor ? '#f59e0b' : isSignature ? '#f59e0b' : isLive ? '#22C55E' : 'hsl(var(--muted-foreground) / 0.7)',
            }}
          >
            {isLive ? '● LIVE' : contextLabel}
          </p>
        </div>
        
        {/* Tournament name */}
        <p
          className="mt-1 line-clamp-1 text-foreground"
          style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.15px' }}
        >
          {tournament.name}
        </p>
        
        {/* Winner/Leader row */}
        {(winnerDisplay || hasLeaderData) && (
          <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: '13px', fontWeight: 500 }}>
            {isFinal && winnerDisplay && (
              <span className="text-muted-foreground">
                <Trophy className="w-3 h-3 inline mr-0.5" style={{ color: '#f59e0b' }} />
                <button
                  onClick={handlePlayerTap}
                  className="transition-opacity active:opacity-70 inline"
                >
                  {winnerDisplay}
                </button>
                {winnerScore !== null && winnerScore !== undefined && (
                  <span className="font-semibold ml-1" style={{ color: '#f59e0b' }}>
                    ({hasSeasonWinner ? (tournament as any).winnerScore : leaderWinner!.displayScore})
                  </span>
                )}
              </span>
            )}
            {hasLeaderData && !isFinal && (
              <span style={{ color: '#22C55E' }}>
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
