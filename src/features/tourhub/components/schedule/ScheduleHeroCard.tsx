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
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';
import { getFinishedScoreColor, formatPurse, PlayerAvatar, PodiumRunnerRow, buildPodiumRows, UpcomingCountdown } from '../shared/TourHeroHelpers';
import { getContextLabel } from '../../utils/tournamentClassification';
import { getCurrentRound } from '../../utils/formatThruDisplay';
import { TOUR_COLORS } from '../../constants/colors';
import '@/styles/hero-glass.css';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
  leaderWinner?: TournamentLeaderWinner;
  currentIndex?: number;
  totalSlides?: number;
  onDotClick?: (index: number) => void;
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

  // Major/signature detection
  const contextLabel = getContextLabel({ name: tournament.name, tourName: tournament.tour_full_name ?? undefined });
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES';

  const handlePlayerTap = (playerId: string | null | undefined) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playerId) navigate(`/tourhub/player/${playerId}`);
  };

  const handleVenueTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (tournament.venue_name) navigate(`/courses?q=${encodeURIComponent(tournament.venue_name)}`);
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
    if (margin === 0) return 'Won in Playoff';
    return `Won by ${margin} stroke${margin === 1 ? '' : 's'}`;
  })();

  // B45 FIX 8: use tour_full_name directly instead of getTourLabel
  const tourLabel = (tournament.tour_full_name || tournament.tour_code || 'TOUR').toUpperCase();

  // B44 FIX 4C: round label for live card
  const roundInfo = (isLive && leaderWinner)
    ? getCurrentRound(leaderWinner.round1, leaderWinner.round2, leaderWinner.round3, leaderWinner.round4)
    : null;
  const roundLabel = roundInfo ? `Round ${roundInfo.currentRound}` : null;

  return (
    <div
      className="block relative overflow-hidden"
      style={{ height: '45dvh' }}
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
            style={{ objectPosition: 'center calc(50% + env(safe-area-inset-top, 0px) * 0.5)' }}
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
          border: isMajor
            ? '1px solid rgba(250, 204, 21, 0.35)'
            : isSignature
            ? '1px solid rgba(16, 185, 129, 0.25)'
            : undefined,
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
                        fullName={winner.fullName}
                        tourCode={winner.tourCode ?? tournament.tour_code}
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
                // B45 FIX 7: animate-pulse skeleton for loading state
                <div
                  className="animate-pulse"
                  style={{ height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.06)', width: 200 }}
                />
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
                    tourCode={tournament.tour_code}
                    onPlayerTap={handlePlayerTap}
                  />
                ))}
              </div>
            )}

            {/* Footer: tour badge left, View Results right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div className="flex items-center gap-1.5">
                {isMajor && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px',
                    color: '#FACC15', textTransform: 'uppercase' as const,
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    borderRadius: 4, padding: '2px 6px',
                  }}>
                    MAJOR
                  </span>
                )}
                {!isMajor && (
                <div className="tour-badge">
                  <span>{tourLabel}</span>
                </div>
                )}
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
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: isMajor ? '#FACC15' : TOUR_COLORS.liveGreen }}>LIVE</span>
                  {/* B44 FIX 4C: round label */}
                  {roundLabel && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
                      · {roundLabel}
                    </span>
                  )}
                </div>
              ) : (
                <span className="countdown-label">
                  {/* B43 FIX 5: timezone-safe date */}
                  {format(new Date(tournament.start_date + 'T12:00:00'), 'MMM d')}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                {isMajor && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px',
                    color: '#FACC15', textTransform: 'uppercase' as const,
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    borderRadius: 4, padding: '2px 6px',
                  }}>
                    MAJOR
                  </span>
                )}
                {!isMajor && (
                <div className="tour-badge">
                  <span>{tourLabel}</span>
                </div>
                )}
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
                          tourCode={leaderWinner.tourCode ?? tournament.tour_code}
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
                        {/* B44 FIX 5: score color */}
                        <span
                          className="score-mono"
                          style={{ fontSize: '18px', fontWeight: 800, color: getFinishedScoreColor(leaderWinner.score), flexShrink: 0 }}
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

                {/* B44 FIX 6: 2nd place runner below leader */}
                {leaderWinner && leaderWinner.topFinishers[0] && leaderWinner.topFinishers[0].playerId !== leaderWinner.playerId && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', marginTop: 4,
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                      T{leaderWinner.topFinishers[0].position} {leaderWinner.topFinishers[0].displayName}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: getFinishedScoreColor(leaderWinner.topFinishers[0].score) }}>
                      {leaderWinner.topFinishers[0].displayScore}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
                  className="hero-text-cta w-full"
                  style={{ marginTop: '8px' }}
                >
                  <span>See Leaderboard</span>
                  <ChevronRight className="w-4 h-4 cta-chevron" />
                </button>
              </>
            )}

            {/* ─── UPCOMING LAYOUT — clean redesign ─── */}
            {isUpcoming && (
              <>
                <UpcomingCountdown startDate={tournament.start_date} />

                {/* Defending champion with squircle avatar */}
                {tournament.defending_champion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <PlayerAvatar
                      displayName={tournament.defending_champion}
                      fullName={tournament.defending_champion}
                      tourCode={tournament.tour_code ?? undefined}
                      size={36}
                      frosted={false}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                        {tournament.defending_champion}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Defending Champion
                      </span>
                    </div>
                  </div>
                )}

                {/* Single metadata line: date range · purse */}
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 8, marginBottom: 0 }}>
                  {[
                    tournament.start_date && tournament.end_date && (() => {
                      const s = new Date(tournament.start_date + 'T12:00:00');
                      const e = new Date(tournament.end_date + 'T12:00:00');
                      return s.getMonth() === e.getMonth()
                        ? `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`
                        : `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
                    })(),
                    tournament.purse && formatPurse(tournament.purse),
                  ].filter(Boolean).join(' · ')}
                </p>

                <button
                  onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
                  className="hero-text-cta w-full"
                  style={{ marginTop: '10px' }}
                >
                  <span>View Tournament</span>
                  <ChevronRight className="w-4 h-4 cta-chevron" />
                </button>
              </>
            )}
          </>
        )}

      </motion.div>
    </div>
  );
}
