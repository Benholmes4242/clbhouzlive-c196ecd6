/**
 * ScheduleHeroCard - Immersive glass-card hero with tappable names + score colors
 *
 * States: live | upcoming | recent (finished)
 * Changes vs previous version:
 *  - Finished: podium layout (top 3), player photos, left-aligned, score via getScoreColor()
 *  - Live: player photo on leader row
 *  - Upcoming: defending champion line
 *  - All: consistent left-align, consistent status badge spacing
 *  - Finished: subtle gold top-border accent
 *  - Score colors: getScoreColor() used consistently across all states
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Trophy, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner, TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';
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

function formatPurse(purse: number | null): string {
  if (!purse) return '';
  return purse >= 1000000
    ? `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`
    : `$${(purse / 1000).toFixed(0)}K`;
}

/** Canonical score color — green under par, red over par, neutral even */
function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.7)';
  if (score < 0) return '#22C55E';
  if (score > 0) return '#EF4444';
  return 'rgba(255,255,255,0.7)';
}

/** Player avatar — 44px circle with photo or initials fallback */
function PlayerAvatar({
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

  const borderRadius = '50%';
  const fontSize = size <= 28 ? 10 : 14;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
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

/** Runner-up row (position 2 or 3) */
function RunnerUpRow({ finisher, onPlayerTap }: { finisher: TournamentFinisher; onPlayerTap: (e: React.MouseEvent) => void }) {
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
      <button onClick={onPlayerTap} className="transition-opacity active:opacity-70">
        <PlayerAvatar photoUrl={finisher.photoUrl} displayName={finisher.displayName} size={26} />
      </button>

      {/* Name */}
      <button
        onClick={onPlayerTap}
        className="flex-1 text-left transition-opacity active:opacity-70"
        style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.72)', minWidth: 0 }}
      >
        <span
          style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
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

  // Winning margin for finished state
  const topFinishers = leaderWinner?.topFinishers ?? [];
  const winner = topFinishers[0] ?? leaderWinner;
  const runnerUp = topFinishers[1];
  const third = topFinishers[2];

  const winningMargin = (() => {
    if (!winner || runnerUp === undefined) return null;
    if (winner.score === null || runnerUp.score === null) return null;
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
        {/* Row 1: Status | Tour Badge — consistent sizing across all states */}
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
                {/* Player photo */}
                <button
                  onClick={handlePlayerTap(leaderWinner.playerId)}
                  className="transition-opacity active:opacity-70"
                >
                  <PlayerAvatar
                    photoUrl={leaderWinner.photoUrl}
                    displayName={leaderWinner.displayName}
                    size={44}
                  />
                </button>

                {/* Name + score */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                    <button
                      onClick={handlePlayerTap(leaderWinner.playerId)}
                      className="transition-opacity active:opacity-70"
                      style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}
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

        {/* ─── COMPLETED (FINISHED) LAYOUT ─── */}
        {isRecent && (
          <>
            {winner && (
              <div style={{ marginTop: 10 }}>
                {/* Winner row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Winner photo */}
                  <button
                    onClick={handlePlayerTap(winner.playerId)}
                    className="transition-opacity active:opacity-70"
                  >
                    <PlayerAvatar
                      photoUrl={winner.photoUrl}
                      displayName={winner.displayName}
                      size={44}
                    />
                  </button>

                  {/* Name + score */}
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
                        style={{ fontSize: '16px', fontWeight: 700, color: getScoreColor(winner.score), flexShrink: 0 }}
                      >
                        {winner.displayScore}
                      </span>
                    </div>
                    {/* Headline stat */}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', marginTop: 2, display: 'block' }}>
                      {winningMargin
                        ? winningMargin
                        : winner.money
                        ? `${formatPurse(winner.money)} winner's share`
                        : null}
                    </span>
                  </div>
                </div>

                {/* Runners-up — only render if data available */}
                {(runnerUp || third) && (
                  <div style={{ marginTop: 6 }}>
                    {runnerUp && (
                      <RunnerUpRow
                        finisher={runnerUp}
                        onPlayerTap={handlePlayerTap(runnerUp.playerId)}
                      />
                    )}
                    {third && (
                      <RunnerUpRow
                        finisher={third}
                        onPlayerTap={handlePlayerTap(third.playerId)}
                      />
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

            {/* Defending champion — only if available */}
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
