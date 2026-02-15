/**
 * ScheduleTournamentCard - Clean list-row design matching WhatsComing EventRow
 * 
 * Design language from Overview:
 * - Date block (month + day) left-aligned
 * - Context label (MAJOR / SIGNATURE / TOUR EVENT) 
 * - Tournament name 17px/600
 * - Venue with MapPin icon 13px/400
 * - bg-card rounded-2xl border border-border/50
 * - Winner/Leader inline display
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

// Type guard
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
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return String(d.getDate());
}

export function ScheduleTournamentCard({ 
  tournament, 
  className, 
  compact = false, 
  leaderWinner, 
}: ScheduleTournamentCardProps) {
  const navigate = useNavigate();

  // Normalize fields
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

  // Winner display
  const hasSeasonWinner = winnerFirstName && winnerLastName && isFinal;
  const hasLeaderWinnerData = leaderWinner && isFinal;
  const hasLeaderData = leaderWinner && isLive;
  
  const winnerDisplay = hasSeasonWinner 
    ? `${winnerFirstName?.charAt(0)}. ${winnerLastName}`
    : hasLeaderWinnerData ? leaderWinner!.displayName : null;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border text-left transition-all active:scale-[0.98] ${className || ''}`}
      style={{
        borderColor: isMajor ? 'rgba(245, 158, 11, 0.35)' : undefined,
        borderLeftWidth: isMajor ? '3px' : undefined,
        borderLeftColor: isMajor ? '#f59e0b' : undefined,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Date block */}
      <div className="flex-shrink-0 w-12 text-center">
        <p className="uppercase leading-none" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.05em', color: '#A8A29E' }}>
          {getMonthAbbr(startDate)}
        </p>
        <p className="leading-none mt-0.5" style={{ fontSize: '17px', fontWeight: 700, color: '#1C1917' }}>
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
              color: isMajor ? '#f59e0b' : isSignature ? 'hsl(var(--primary))' : isLive ? '#f59e0b' : '#A8A29E',
            }}
          >
            {isLive ? '● LIVE' : contextLabel}
          </p>
        </div>
        
        {/* Tournament name */}
        <p
          className="mt-1 line-clamp-1"
          style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.15px', color: '#1C1917' }}
        >
          {tournament.name}
        </p>
        
        {/* Winner/Leader row */}
        {(winnerDisplay || hasLeaderData) && (
          <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>
            {isFinal && winnerDisplay && (
              <span style={{ color: '#78716C' }}>
                <Trophy className="w-3 h-3 inline mr-0.5" style={{ color: '#f59e0b' }} />
                {winnerDisplay}
                {(hasSeasonWinner ? (tournament as any).winnerScore : leaderWinner?.displayScore) && (
                  <span className="font-mono ml-1" style={{ color: '#A8A29E' }}>
                    ({hasSeasonWinner ? (tournament as any).winnerScore : leaderWinner!.displayScore})
                  </span>
                )}
              </span>
            )}
            {hasLeaderData && !isFinal && (
              <span style={{ color: '#f59e0b' }}>
                Leader: {leaderWinner!.displayName}
                <span className="font-mono ml-1">{leaderWinner!.displayScore}</span>
              </span>
            )}
          </p>
        )}
        
        {/* Venue */}
        {venue && !compact && (
          <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: '13px', fontWeight: 400, color: '#78716C' }}>
            <MapPin className="w-3 h-3 flex-shrink-0 opacity-60" />
            <span className="line-clamp-1">{venue}</span>
          </p>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Prefetch course images for a list of tournaments
 */
export function prefetchTournamentImages(_tournaments: (TourTournament | SeasonTournament)[]) {
  // No-op: list view no longer uses course images
}
