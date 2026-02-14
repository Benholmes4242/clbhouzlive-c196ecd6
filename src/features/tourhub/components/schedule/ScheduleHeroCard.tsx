/**
 * ScheduleHeroCard - Immersive glass-card hero matching Overview HeroCarousel
 * 
 * Design language from OverviewPageV3:
 * - Full-bleed background with Ken Burns (1.03x)
 * - Glass card (rgba(0,0,0,0.45), blur(24px)) bottom-left
 * - Hero typography: 22px/800 name, 13px/500 venue, 11px/700 meta
 * - Live: amber pulsing dot + leaderboard rows
 * - Completed: Winner avatar (squircle 34%) + yellow score
 * - Upcoming: Countdown label + course stats
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
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

export function ScheduleHeroCard({ tournament, type, leaderWinner }: ScheduleHeroCardProps) {
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

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="block relative overflow-hidden active:scale-[0.98] transition-transform"
      style={{ height: '380px' }}
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
        <img
          src={imageUrl}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
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

      {/* Glass Card - matching HeroCarousel exactly */}
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
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#34C759' }}>LIVE</span>
            </div>
          ) : isRecent ? (
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
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
        
        {/* Row 3: Venue */}
        <p className="hero-venue">
          {tournament.venue_name}
          {tournament.venue_city && ` · ${tournament.venue_city}`}
        </p>

        {/* ─── LIVE LAYOUT ─── */}
        {isLive && (
          <>
            {leaderWinner && (
              <div className="flex items-center gap-1.5" style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  Leader: {leaderWinner.displayName}
                </span>
                <span className="score-mono" style={{ fontSize: '16px', fontWeight: 700, color: '#E09F3E' }}>
                  {leaderWinner.displayScore}
                </span>
              </div>
            )}
            <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
              <span>See Leaderboard</span>
              <ChevronRight className="w-4 h-4 cta-chevron" />
            </div>
          </>
        )}

        {/* ─── COMPLETED LAYOUT ─── */}
        {isRecent && (
          <>
            {leaderWinner && (
              <div className="winner-section" style={{ padding: '8px 0 0' }}>
                <span className="winner-name-large" style={{ marginTop: 0 }}>
                  🏆 {leaderWinner.displayName}
                </span>
                {leaderWinner.displayScore && (
                  <span className="winner-score-large" style={{ marginTop: '2px' }}>
                    ({leaderWinner.displayScore})
                    {leaderWinner.money && ` · ${formatPurse(leaderWinner.money)}`}
                  </span>
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
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px', marginTop: '8px' }}>
              {[
                tournament.purse && formatPurse(tournament.purse),
                tournament.venue_par && `PAR ${tournament.venue_par}`,
                tournament.venue_yardage && `${tournament.venue_yardage.toLocaleString()} YDS`
              ].filter(Boolean).join(' · ')}
            </p>
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

// Helper to determine which tournament to feature
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
