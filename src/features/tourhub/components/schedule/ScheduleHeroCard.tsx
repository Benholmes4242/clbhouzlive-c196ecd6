/**
 * ScheduleHeroCard - Compact glass-card hero for Schedule page
 *
 * States: live | upcoming | recent (finished)
 *  - Finished: Compact winner spotlight — no stats panel, 48px avatar, max 2 runners
 *  - Live: player photo on leader row with frosted highlight
 *  - Upcoming: defending champion, tight spacing, centered CTA
 *  - Helpers: shared from TourHeroHelpers (no duplication)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';
import { getFinishedScoreColor, formatPurse, PlayerAvatar, PodiumRunnerRow, buildPodiumRows } from '../shared/TourHeroHelpers';
import '@/styles/hero-glass.css';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
  leaderWinner?: TournamentLeaderWinner;
  currentIndex?: number;
  totalSlides?: number;
  onDotClick?: (index: number) => void;
}

function getTourLabel(tourCode?: string): string {
  const labels: Record<string, string> = {
    pga: 'PGA TOUR', EURO: 'DP WORLD TOUR', LPGA: 'LPGA',
    CHAMP: 'CHAMPIONS', PGAD: 'KORN FERRY', LIV: 'LIV GOLF',
  };
  return labels[tourCode || ''] || 'TOUR';
}


export function ScheduleHeroCard({ tournament, type, leaderWinner, currentIndex = 0, totalSlides = 1, onDotClick }: ScheduleHeroCardProps) {
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

  // Podium data for finished state — position-based rows
  const allFetched = leaderWinner?.allFetched ?? leaderWinner?.topFinishers ?? [];
  const podiumRows = buildPodiumRows(allFetched);
  const winnerRow = podiumRows[0];
  const runnerRows = podiumRows.slice(1, 3); // Max 2 runners for compact layout
  const winner = winnerRow?.players[0] ?? leaderWinner;

  const winningMargin = (() => {
    if (!winnerRow || podiumRows.length < 2) return null;
    if (winnerRow.isTied) return 'Co-winners';
    const row2 = podiumRows[1];
    if (winnerRow.sharedScore === null || row2.sharedScore === null) return null;
    const margin = row2.sharedScore - winnerRow.sharedScore;
    if (margin === 0) return 'Won in playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="block relative overflow-hidden active:scale-[0.98] transition-transform"
      style={{ height: '50dvh' }}
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
          bottom: '16px',
          left: '16px',
          top: 'auto',
          minWidth: '260px',
          maxWidth: 'min(330px, calc(100% - 32px))',
          padding: '16px 16px 12px 16px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        {/* ─── FINISHED: compact winner spotlight ─── */}
        {isRecent ? (
          <>
            {/* Tournament Name — top of card */}
            <h2 className="hero-tournament-name">{tournament.name}</h2>

            {/* Venue */}
            <button
              onClick={handleVenueTap}
              className="hero-venue block text-left transition-opacity active:opacity-70"
            >
              {tournament.venue_name}
              {tournament.venue_city && ` · ${tournament.venue_city}`}
            </button>

            {/* Winner section — compact 48px avatar */}
            <div style={{ marginTop: 12, minHeight: 48 }}>
              {winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handlePlayerTap(winner.playerId)}
                    className="transition-opacity active:opacity-70"
                    style={{ flexShrink: 0 }}
                  >
                     <PlayerAvatar
                        photoUrl={winner.photoUrl}
                        pgaTourId={winner.pgaTourId}
                        displayName={winner.displayName}
                        size={48}
                        frosted
                      />
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                      <button
                        onClick={handlePlayerTap(winner.playerId)}
                        className="transition-opacity active:opacity-70"
                        style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}
                      >
                        {winner.displayName}
                      </button>
                      <span
                        className="score-mono"
                        style={{ fontSize: '17px', fontWeight: 700, color: getFinishedScoreColor(winner.score), flexShrink: 0 }}
                      >
                        {winner.displayScore}
                      </span>
                    </div>

                    {(winningMargin || winner.money) && (
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', marginTop: 2, display: 'block' }}>
                        {winningMargin ?? `${formatPurse(winner.money!)} winner's share`}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)', width: 200 }} />
              )}
            </div>

            {/* Runners-up — max 2 rows */}
            {runnerRows.length > 0 && (
              <div style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                {runnerRows.map(row => (
                  <PodiumRunnerRow
                    key={row.position}
                    row={row}
                    onPlayerTap={handlePlayerTap}
                  />
                ))}
              </div>
            )}

            {/* Footer: tour badge left, View Results right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div className="tour-badge">
                <span>{getTourLabel(tournament.tour_code)}</span>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); navigate(`/tourhub/tournament/${tournament.id}`); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                View Results
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ─── NON-FINISHED: standard top row with status + tour badge ─── */}
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              {isLive ? (
                <div className="flex items-center gap-1.5">
                  <span className="live-dot" />
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#22C55E' }}>LIVE</span>
                </div>
              ) : (
                <span className="countdown-label">
                  {format(new Date(tournament.start_date), 'MMM d')}
                </span>
              )}
              <div className="tour-badge">
                <span>{getTourLabel(tournament.tour_code)}</span>
              </div>
            </div>

            {/* Tournament Name */}
            <h2 className="hero-tournament-name">{tournament.name}</h2>

            {/* Venue */}
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '8px',
                    margin: '10px -8px 0 -8px',
                  }}>
                    <button
                      onClick={handlePlayerTap(leaderWinner.playerId)}
                      className="transition-opacity active:opacity-70"
                    >
                       <PlayerAvatar
                          photoUrl={leaderWinner.photoUrl}
                          pgaTourId={leaderWinner.pgaTourId}
                          displayName={leaderWinner.displayName}
                          size={36}
                          frosted
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
                          style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}
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

            {/* ─── UPCOMING LAYOUT — tight spacing ─── */}
            {isUpcoming && (
              <>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px', marginTop: '6px' }}>
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
                <p className="hero-meta" style={{ marginBottom: '6px' }}>
                  {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
                </p>
                <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
                  <span>View Tournament</span>
                  <ChevronRight className="w-4 h-4 cta-chevron" />
                </div>
              </>
            )}
          </>
        )}

        {/* Pagination dots — inside glass card */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDotClick?.(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-[18px] h-[6px] bg-white/90'
                    : 'w-[6px] h-[6px] bg-white/40'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
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