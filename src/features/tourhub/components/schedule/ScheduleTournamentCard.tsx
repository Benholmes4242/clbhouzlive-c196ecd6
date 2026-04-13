/**
 * ScheduleTournamentCard - Flat ruled row design
 * No border-radius, no card bg. Hairline border handled by parent.
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy } from 'lucide-react';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { getContextLabel } from '../../utils/tournamentClassification';
import { TOUR_COLORS } from '../../constants/colors';
import { getCurrentRound } from '../../utils/formatThruDisplay';
import { formatPurse } from '../shared/TourHeroHelpers';

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
  if (score === null || score === undefined) return '#94A3B8';
  if (score < 0) return '#F7931E';
  if (score > 0) return '#EF4444';
  return '#94A3B8';
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

  const winnerDisplayScore = leaderWinner?.displayScore ?? null;

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

  const ariaLabel = [
    tournament.name,
    isLive ? 'live' : isFinal ? 'completed' : 'upcoming',
    isLive && leaderWinner ? `leader ${leaderWinner.displayName} at ${leaderWinner.displayScore}` : null,
    isFinal && winnerDisplay ? `winner ${winnerDisplay}` : null,
    venueName ? `at ${venueName}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className={`w-full flex items-start gap-0 cursor-pointer active:bg-black/[0.02] transition-colors ${className || ''}`}
      style={{
        borderLeft: (isLive || isMajor || isSignature || isRolex)
          ? `3px solid ${isLive ? TOUR_COLORS.liveGreen : isMajor ? TOUR_COLORS.liveAmber : 'rgba(16,185,129,0.8)'}`
          : '3px solid transparent',
        background: 'transparent',
      }}
      role="button"
      aria-label={ariaLabel}
    >
      {/* Date block */}
      <div style={{
        flexShrink: 0,
        width: '52px',
        padding: '12px 0 12px 16px',
        textAlign: 'left' as const,
      }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.08em', textTransform: 'uppercase' as const, lineHeight: 1, margin: 0 }}>
          {getMonthAbbr(displayDate)}
        </p>
        <p style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', lineHeight: 1, marginTop: '2px', letterSpacing: '-0.02em', margin: '2px 0 0' }}>
          {getDayNum(displayDate)}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 12px 10px' }}>
        {/* Context label */}
        <p style={{
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          lineHeight: 1,
          marginBottom: '4px',
          margin: '0 0 4px',
          color: isMajor
            ? TOUR_COLORS.liveAmber
            : (isSignature || isRolex)
            ? 'rgba(16,185,129,0.9)'
            : isLive
            ? TOUR_COLORS.liveGreen
            : '#94A3B8',
        }}>
          {isLive ? '● LIVE' : contextLabel}
          {isLive && leaderWinner?.round1 !== undefined && (() => {
            const roundInfo = getCurrentRound(
              leaderWinner!.round1, leaderWinner!.round2,
              leaderWinner!.round3, leaderWinner!.round4
            );
            return roundInfo ? (
              <span style={{ fontWeight: 500, color: 'rgba(34,197,94,0.6)', marginLeft: '4px', letterSpacing: '0.04em' }}>
                R{roundInfo.currentRound}
              </span>
            ) : null;
          })()}
        </p>

        {/* Tournament name */}
        <p style={{
          fontSize: '15px',
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: '4px',
          margin: '0 0 4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>
          {tournament.name}
        </p>

        {/* Winner / Leader row */}
        {(winnerDisplay || hasLeaderData) && (
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '3px', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isFinal && winnerDisplay && (
              <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trophy style={{ width: 12, height: 12, color: TOUR_COLORS.liveAmber, flexShrink: 0 }} />
                <button onClick={handlePlayerTap} className="transition-opacity active:opacity-70" style={{ color: '#0F172A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {winnerDisplay}
                </button>
                {winnerDisplayScore && (
                  <span style={{ color: TOUR_COLORS.liveAmber, fontWeight: 700 }}>({winnerDisplayScore})</span>
                )}
              </span>
            )}
            {hasLeaderData && !isFinal && (
              <span style={{ color: TOUR_COLORS.liveGreen }}>
                Leader:{' '}
                <button onClick={handlePlayerTap} className="transition-opacity active:opacity-70" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>{leaderWinner!.displayName}</button>
                <span style={{ fontWeight: 700, marginLeft: '4px', color: getScoreColor(leaderWinner!.score) }}>{leaderWinner!.displayScore}</span>
              </span>
            )}
          </p>
        )}

        {/* Date range + purse for upcoming */}
        {!isLive && !isFinal && (() => {
          const endDate = isSeasonTournament(tournament) ? null : (tournament as TourTournament).end_date;
          const purse = isSeasonTournament(tournament) ? null : (tournament as TourTournament).purse;
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
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '3px', margin: '0 0 3px' }}>{parts.join(' · ')}</p>
          ) : null;
        })()}

        {/* Venue */}
        {venue && !compact && (
          <button
            onClick={handleVenueTap}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="transition-opacity active:opacity-70"
          >
            <MapPin style={{ width: 10, height: 10, flexShrink: 0, opacity: 0.6 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{venue}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function prefetchTournamentImages(_tournaments: (TourTournament | SeasonTournament)[]) {
  // No-op: list view no longer uses course images
}
