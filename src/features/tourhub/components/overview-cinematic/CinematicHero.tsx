/**
 * CinematicHero - Full-viewport immersive hero ("The Pulse")
 * 85vh height, Ken Burns animation, glass overlay with mini leaderboard
 * Per Apple-grade redesign spec
 */

import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, ChevronRight, Play, BarChart3, Map, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CinematicImage, LiveIndicator, GlassCard } from '../premium';
import type { TourTournament } from '../../hooks/useTourHubData';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: string;
  thru: string;
  today: string;
}

interface CinematicHeroProps {
  tournament: TourTournament;
  type: 'live' | 'recent' | 'upcoming';
  courseImageUrl?: string | null;
  leaderboard?: LeaderboardEntry[];
  lastUpdated?: Date;
}

export function CinematicHero({ 
  tournament, 
  type, 
  courseImageUrl,
  leaderboard = [],
  lastUpdated,
}: CinematicHeroProps) {
  const isLive = type === 'live';
  const hasLeaderboard = leaderboard.length > 0;

  // Status config
  const statusConfig = {
    live: { 
      label: 'LIVE NOW',
      showLiveIndicator: true,
    },
    recent: { 
      label: 'COMPLETED',
      showLiveIndicator: false,
    },
    upcoming: { 
      label: 'UPCOMING',
      showLiveIndicator: false,
    },
  };

  const status = statusConfig[type];

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden -mx-4 sm:-mx-6"
      style={{ height: '85vh', maxHeight: '700px', minHeight: '500px' }}
    >
      {/* Background with Ken Burns */}
      <CinematicImage
        src={courseImageUrl || undefined}
        alt={tournament.venue_name || tournament.name}
        className="absolute inset-0"
        priority
      />

      {/* Fallback gradient when no image */}
      {!courseImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-black">
          {/* Subtle topographic pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-topo-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M0 40 Q20 20 40 40 T80 40" fill="none" stroke="white" strokeWidth="0.5" />
                <path d="M0 60 Q20 40 40 60 T80 60" fill="none" stroke="white" strokeWidth="0.3" />
                <circle cx="60" cy="25" r="12" fill="none" stroke="white" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#hero-topo-pattern)" />
          </svg>
        </div>
      )}

      {/* Cinematic gradient overlays */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 35%)' 
        }} 
      />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 70%)' 
        }} 
      />

      {/* Content container */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        {/* Glass card with content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard className="p-5 sm:p-6" variant="elevated">
            {/* Status badge row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {status.showLiveIndicator && <LiveIndicator />}
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  isLive ? "text-[hsl(var(--th-accent-live))]" : "text-white/70"
                )}>
                  {status.label}
                </span>
              </div>
              
              {lastUpdated && isLive && (
                <span className="text-[10px] text-white/50">
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Tournament name */}
            <h1 className="th-display-l text-white mb-2 leading-[1.1]">
              {tournament.name}
            </h1>

            {/* Venue */}
            <div className="flex items-center gap-1.5 text-white/80 th-body-small mb-4">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {tournament.venue_name}
                {tournament.venue_city && `, ${tournament.venue_city}`}
                {tournament.venue_state && `, ${tournament.venue_state}`}
              </span>
            </div>

            {/* Mini Leaderboard (if live with data) */}
            {hasLeaderboard && (
              <div className="border-t border-white/10 pt-4 mb-4">
                <div className="space-y-2">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between text-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs font-medium text-white/60">
                          {entry.rank}
                        </span>
                        <span className="th-body font-medium">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono font-bold">
                          {entry.score}
                        </span>
                        <span className="text-white/60 text-xs">
                          {entry.thru}
                        </span>
                        <span className={cn(
                          "text-xs font-medium min-w-[48px] text-right",
                          entry.today.startsWith('-') ? "text-[hsl(var(--th-accent-birdie))]" : 
                          entry.today.startsWith('+') ? "text-[hsl(var(--th-accent-bogey))]" :
                          "text-white/60"
                        )}>
                          Today {entry.today}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {leaderboard.length > 3 && (
                  <p className="text-white/50 text-xs mt-2">
                    + {leaderboard.length - 3} more playing
                  </p>
                )}
              </div>
            )}

            {/* View full leaderboard CTA */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 th-body-small flex items-center gap-1 group-hover:text-white transition-colors">
                View Full Leaderboard
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              
              {/* Date for non-live */}
              {!isLive && (
                <span className="text-white/50 text-xs">
                  {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
                </span>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Floating action row (for live events) */}
        {isLive && (
          <motion.div 
            className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {[
              { icon: Play, label: 'Watch Live' },
              { icon: BarChart3, label: 'Stats' },
              { icon: Map, label: 'Course Map' },
              { icon: Bell, label: 'Alert Me' },
            ].map((action, index) => (
              <button
                key={action.label}
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                  "bg-white/10 backdrop-blur-md border border-white/10",
                  "text-white text-sm font-medium",
                  "hover:bg-white/20 transition-colors",
                  "flex-shrink-0"
                )}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </Link>
  );
}
