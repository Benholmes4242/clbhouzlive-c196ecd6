/**
 * ScheduleHeroCard - Cinematic immersive hero card (Apple-grade)
 * 
 * Features:
 * - Full-bleed 280px immersive container
 * - Ken Burns animation (scale 1.08)
 * - Premium glassmorphism status badges
 * - Leader/winner display for live/completed
 * - font-mono on stat values
 * - Entire-card tap feedback
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Calendar, ChevronRight, DollarSign, Flag, Ruler, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
  /** Leader/winner data from useTournamentLeadersWinners */
  leaderWinner?: TournamentLeaderWinner;
}

// Status badge with glassmorphism
function HeroStatusBadge({ type }: { type: 'live' | 'upcoming' | 'recent' }) {
  const config = {
    live: { 
      text: 'Live Now', 
      icon: <Zap className="w-3.5 h-3.5" />, 
      className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30',
      pulse: true
    },
    upcoming: { 
      text: 'Next Up', 
      icon: <Calendar className="w-3.5 h-3.5" />, 
      className: 'bg-white/15 backdrop-blur-xl text-white border border-white/20',
      pulse: false
    },
    recent: { 
      text: 'Just Finished', 
      icon: <Trophy className="w-3.5 h-3.5" />, 
      className: 'bg-black/40 backdrop-blur-xl text-white border border-white/10',
      pulse: false
    },
  };

  const c = config[type];

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider",
      c.className
    )}>
      {c.pulse && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      )}
      {!c.pulse && c.icon}
      {c.text}
    </div>
  );
}

export function ScheduleHeroCard({ tournament, type, leaderWinner }: ScheduleHeroCardProps) {
  // Resolve course image
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

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden active:scale-[0.98] transition-transform"
    >
      {/* Premium hero container - full bleed, 320px height */}
      <motion.div 
        className="relative overflow-hidden"
        style={{ height: '320px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background image with Ken Burns */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'linear' }}
        >
          <img 
            src={imageUrl}
            alt={tournament.venue_name || tournament.name}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </motion.div>
        
        {/* Cinematic gradient scrim */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.15) 100%),
              linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%)
            `,
          }}
        />

        {/* Status Badge - top left */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          <HeroStatusBadge type={type} />
          {/* Tour badge */}
          {tournament.tour_full_name && (
            <span 
              className="inline-flex w-fit items-center text-[10px] font-bold uppercase tracking-wider text-white/85"
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(8px)',
                letterSpacing: '0.6px',
              }}
            >
              {tournament.tour_full_name}
            </span>
          )}
        </div>

        {/* Tap affordance - glassmorphic circle */}
        <motion.div 
          className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-16 p-5 sm:p-6">
          {/* Tournament Name */}
          <motion.h2 
            className="font-extrabold text-white line-clamp-2 mb-2"
            style={{ 
              fontSize: 'clamp(24px, 5vw, 32px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {tournament.name}
          </motion.h2>

          {/* Leader display for live */}
          {isLive && leaderWinner && (
            <motion.div
              className="flex items-center gap-1.5 mb-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-sm font-semibold text-white/90">
                Leader: {leaderWinner.displayName}
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: '#FF3B30' }}>
                {leaderWinner.displayScore}
              </span>
            </motion.div>
          )}

          {/* Winner display for completed */}
          {isRecent && leaderWinner && (
            <motion.div
              className="flex items-center gap-1.5 mb-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{ color: '#FFD700', fontSize: '13px', fontWeight: 600 }}>
                🏆 {leaderWinner.displayName}
                <span className="font-mono"> {leaderWinner.displayScore}</span>
                {leaderWinner.money && (
                  <span className="font-mono"> (${(leaderWinner.money / 1_000_000).toFixed(1)}M)</span>
                )}
              </span>
            </motion.div>
          )}

          {/* Dates */}
          <motion.p 
            className="text-sm font-medium text-white/90 mb-2"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </motion.p>

          {/* Location */}
          {(tournament.venue_name || tournament.venue_city) && (
            <motion.div 
              className="flex items-center gap-2 text-sm text-white/75 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {[tournament.venue_name, tournament.venue_city, tournament.venue_country].filter(Boolean).join(' • ')}
              </span>
            </motion.div>
          )}

          {/* Stats row - glassmorphic pills with font-mono */}
          <motion.div 
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {tournament.purse && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-mono">${(tournament.purse / 1_000_000).toFixed(1)}M</span>
              </div>
            )}
            {tournament.venue_par && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="font-mono">Par {tournament.venue_par}</span>
              </div>
            )}
            {tournament.venue_yardage && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="font-mono">{tournament.venue_yardage.toLocaleString()} yds</span>
              </div>
            )}
          </motion.div>
        </div>
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

  // Priority 1: Live tournament
  const live = tournaments.find(t => t.status === 'inprogress');
  if (live) return { tournament: live, type: 'live' };

  // Priority 2: Next upcoming
  const upcoming = tournaments
    .filter(t => t.status === 'scheduled' || t.status === 'created')
    .filter(t => new Date(t.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  if (upcoming.length > 0) return { tournament: upcoming[0], type: 'upcoming' };

  // Priority 3: Most recent completed
  const completed = tournaments
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  if (completed.length > 0) return { tournament: completed[0], type: 'recent' };

  // Fallback: first tournament
  return { tournament: tournaments[0], type: 'upcoming' };
}
