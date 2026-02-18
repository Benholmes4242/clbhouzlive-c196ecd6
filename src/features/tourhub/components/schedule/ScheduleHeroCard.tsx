/**
 * ScheduleHeroCard - Immersive glass-card hero with tappable names + score colors
 *
 * States: live | upcoming | recent (finished)
 *  - Finished: podium layout (top 3), player photos, left-aligned, score via getScoreColor()
 *  - Live: player photo on leader row
 *  - Upcoming: defending champion line
 *  - All: consistent left-align, consistent status badge spacing
 *  - Finished: subtle gold top-border accent
 *  - Helpers: shared from TourHeroHelpers (no duplication)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Trophy, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';
import { getScoreColor, getFinishedScoreColor, formatPurse, PlayerAvatar, RunnerUpRow } from '../shared/TourHeroHelpers';
import '@/styles/hero-glass.css';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
  leaderWinner?: TournamentLeaderWinner;
}

function getTourLabel(tourCode?: string): string {
  const labels: Record<string, string> = {
    pga: 'PGA TOUR', EURO: 'DP WORLD', LPGA: 'LPGA',
    CHAMP: 'CHAMPIONS', PGAD: 'PGA DEV', LIV: 'LIV GOLF',
  };
  return labels[tourCode || ''] || 'TOUR';
}

export function ScheduleHeroCard({ tournament, type, leaderWinner }: ScheduleHeroCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const { courseImage } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const imageUrl = courseImage?.imageUrl || getCourseImage({ id: tournament.id });
  const isLive = type === 'live';
  const isRecent = type === 'recent';
  const isUpcoming = type === 'upcoming';

  const handlePlayerTap = (playerId: string | null | undefined) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  const handleVenueTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (tournament.venue_name) navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venue_name)}`);
  };

  // Podium data for finished state
  const topFinishers = leaderWinner?.topFinishers ?? [];
  const allFetched = leaderWinner?.allFetched ?? topFinishers;
  const winner = topFinishers[0] ?? leaderWinner;
  const runnerUp = topFinishers[1];
  const third = topFinishers[2];

  // Helper: is this position tied?
  const isPositionTied = (position: number) =>
    allFetched.filter(f => f.position === position).length > 1;

  // Count extra tied players at the last shown position not shown on the card
  const lastShownPosition = third?.position ?? runnerUp?.position;
  const extraTied = lastShownPosition != null
    ? allFetched.filter(f => f.position === lastShownPosition).length
      - topFinishers.filter(f => f.position === lastShownPosition).length
    : 0;

  const winningMargin = (() => {
    if (!winner || !runnerUp) return null;
    if (winner.score === null || runnerUp.score === null) return null;
    // Co-winners — both at position 1
    if ((winner as any).position === (runnerUp as any).position) return 'Co-winners';
    const margin = runnerUp.score - winner.score;
    if (margin === 0) return 'Won in playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  // Gold accent border for finished state
  const finishedBorderTop = isRecent ? '2px solid rgba(250, 204, 21, 0.30)' : undefined;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="block relative overflow-hidden active:scale-[0.98] transition-transform"
      style={{ height: 'clamp(282px, 53vh, 422px)' }}
    >
      {/* Background with Ken Burns */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.03, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 5, ease: 'linear' }
        }}
      >
        {!imgError ? (
          <img
            src={imageUrl}
            alt={tournament.venue_name || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-700" />
        )}
      </motion.div>

      {/* Legibility gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)
          `,
        }}
      />

      {/* Glass Card */}
      <motion.div
        className="glass-card"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '16px',
          top: 'auto',
          minWidth: '280px',
          maxWidth: 'min(350px, calc(100% - 32px))',
          padding: '20px 20px 12px 20px',
          borderTop: finishedBorderTop,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        {/* Row 1: Status | Tour Badge */}
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="live-dot" />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#22C55E' }}>LIVE</span>
            </div>
          ) : isRecent ? (
            <div className="flex items-center gap-1.5">
              <Trophy style={{ width: 14, height: 14, color: '#FACC15', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#FACC15' }}>FINISHED</span>
            </div>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
              {format(new Date(tournament.start_date), 'MMM d')}
            </span>
          )}

          <div className="tour-badge">
            <span>{getTourLabel(tournament.tour_code)}</span>
          </div>
        </div>

        {/* Row 2: Tournament Name */}
        <h2 className="hero-tournament-name">{tournament.name}</h2>

        {/* Row 3: Venue (tappable) */}
        <button
          onClick={handleVenueTap}
          className="hero-venue block text-left transition-opacity active:opacity-70"
        >
          {tournament.venue_name}
          {tournament.venue_city && ` · ${tournament.venue_city}`}
        </button>

        {/* ─── LIVE LAYOUT ─── */}
        {isLive && (
          <>
            {leaderWinner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <button
                  onClick={handlePlayerTap(leaderWinner.playerId)}
                  className="transition-opacity active:opacity-70"
                >
                  <PlayerAvatar
                    photoUrl={leaderWinner.photoUrl}
                    pgaTourId={leaderWinner.pgaTourId}
                    displayName={leaderWinner.displayName}
                    size={44}
                  />
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                    <button
                      onClick={handlePlayerTap(leaderWinner.playerId)}
                      className="transition-opacity active:opacity-70"
                      style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}
                    >
                      {leaderWinner.displayName}
                    </button>
                    <span
                      className="score-mono"
                      style={{ fontSize: '16px', fontWeight: 700, color: getScoreColor(leaderWinner.score), flexShrink: 0 }}
                    >
                      {leaderWinner.displayScore}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: 1, display: 'block' }}>
                    Leader
                  </span>
                </div>
              </div>
            )}
            <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
              <span>See Leaderboard</span>
              <ChevronRight className="w-4 h-4 cta-chevron" />
            </div>
          </>
        )}

        {/* ─── FINISHED (COMPLETED) LAYOUT ─── */}
        {isRecent && (
          <>
            {winner && (
              <div style={{ marginTop: 10 }}>
                {/* Winner row — horizontal, photo beside name/score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={handlePlayerTap(winner.playerId)}
                    className="transition-opacity active:opacity-70"
                  >
                    <PlayerAvatar
                      photoUrl={winner.photoUrl}
                      pgaTourId={winner.pgaTourId}
                      displayName={winner.displayName}
                      size={44}
                    />
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={handlePlayerTap(winner.playerId)}
                        className="transition-opacity active:opacity-70"
                        style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}
                      >
                        {winner.displayName}
                      </button>
                      <span
                        className="score-mono"
                        style={{ fontSize: '16px', fontWeight: 700, color: getFinishedScoreColor(winner.score), flexShrink: 0 }}
                      >
                        {winner.displayScore}
                      </span>
                    </div>
                    {/* Winning margin / headline stat */}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', marginTop: 2, display: 'block' }}>
                      {winningMargin
                        ? winningMargin
                        : winner.money
                        ? `${formatPurse(winner.money)} winner's share`
                        : null}
                    </span>
                  </div>
                </div>

                {/* Runners-up — positions 2 and 3 */}
                {(runnerUp || third) && (
                  <div style={{ marginTop: 6 }}>
                    {runnerUp && (
                      <RunnerUpRow
                        finisher={runnerUp}
                        isTied={isPositionTied(runnerUp.position)}
                        onPlayerTap={handlePlayerTap(runnerUp.playerId)}
                      />
                    )}
                    {third && (
                      <RunnerUpRow
                        finisher={third}
                        isTied={isPositionTied(third.position)}
                        onPlayerTap={handlePlayerTap(third.playerId)}
                      />
                    )}
                    {extraTied > 0 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.4)',
                        display: 'block',
                        marginTop: 2,
                        paddingLeft: 28,
                      }}>
                        +{extraTied} {extraTied === 1 ? 'other' : 'others'} tied
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
              <span>View Results</span>
              <ChevronRight className="w-4 h-4 cta-chevron" />
            </div>
          </>
        )}

        {/* ─── UPCOMING LAYOUT ─── */}
        {isUpcoming && (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px', marginTop: '8px' }}>
              {[
                tournament.purse && formatPurse(tournament.purse),
                tournament.venue_par && `PAR ${tournament.venue_par}`,
                tournament.venue_yardage && `${tournament.venue_yardage.toLocaleString()} YDS`
              ].filter(Boolean).join(' · ')}
            </p>

            {tournament.defending_champion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '4px' }}>
                <Shield style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                  Defending: {tournament.defending_champion}
                </span>
              </div>
            )}

            <p className="hero-meta">
              {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
            </p>
            <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
              <span>View Tournament</span>
              <ChevronRight className="w-4 h-4 cta-chevron" />
            </div>
          </>
        )}
      </motion.div>
    </Link>
  );
}

export function getFeaturedTournament(
  tournaments: TourTournament[]
): { tournament: TourTournament; type: 'live' | 'upcoming' | 'recent' } | null {
  if (!tournaments || tournaments.length === 0) return null;
  const now = new Date();
  const live = tournaments.find(t => t.status === 'inprogress');
  if (live) return { tournament: live, type: 'live' };
  const upcoming = tournaments
    .filter(t => t.status === 'scheduled' || t.status === 'created')
    .filter(t => new Date(t.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  if (upcoming.length > 0) return { tournament: upcoming[0], type: 'upcoming' };
  const completed = tournaments
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  if (completed.length > 0) return { tournament: completed[0], type: 'recent' };
  return { tournament: tournaments[0], type: 'upcoming' };
}
