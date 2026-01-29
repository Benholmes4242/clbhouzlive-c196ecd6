/**
 * ThisWeekSection - Multi-tour summary with visual status indicators
 * Shows PGA, LPGA, DP World Tour events for the current week
 * Per Apple-grade redesign spec
 */

import { Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Trophy, Users } from 'lucide-react';
import { GlassCard, LiveIndicator } from '../premium';
import type { TourTournament } from '../../hooks/useTourHubData';

interface ThisWeekSectionProps {
  tournaments: TourTournament[];
}

// Tour branding config
const tourConfig: Record<string, { label: string; color: string; bgGradient: string }> = {
  pga: { 
    label: 'PGA TOUR', 
    color: 'text-blue-400',
    bgGradient: 'from-blue-900/40 to-slate-900/60'
  },
  lpga: { 
    label: 'LPGA TOUR', 
    color: 'text-pink-400',
    bgGradient: 'from-pink-900/40 to-slate-900/60'
  },
  dp: { 
    label: 'DP WORLD TOUR', 
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-900/40 to-slate-900/60'
  },
  liv: { 
    label: 'LIV GOLF', 
    color: 'text-orange-400',
    bgGradient: 'from-orange-900/40 to-slate-900/60'
  },
};

// Get tournament status
function getTournamentStatus(tournament: TourTournament): 'live' | 'upcoming' | 'complete' {
  if (tournament.status === 'inprogress') return 'live';
  if (tournament.status === 'closed') return 'complete';
  return 'upcoming';
}

// Get current round text
function getRoundText(tournament: TourTournament): string {
  // Would need leaderboard data for actual round info
  // For now, derive from dates
  const now = new Date();
  const start = parseISO(tournament.start_date);
  const end = parseISO(tournament.end_date);
  
  if (tournament.status === 'inprogress') {
    const dayIndex = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `Round ${Math.min(dayIndex, 4)}`;
  }
  if (tournament.status === 'closed') {
    return 'Complete';
  }
  return `Starts ${format(start, 'EEE')}`;
}

interface TournamentRowProps {
  tournament: TourTournament;
  tour: string;
}

function TournamentRow({ tournament, tour }: TournamentRowProps) {
  const status = getTournamentStatus(tournament);
  const config = tourConfig[tour] || tourConfig.pga;
  const isLive = status === 'live';
  const isComplete = status === 'complete';

  return (
    <Link to={`/tourhub/tournament/${tournament.id}`}>
      <motion.div
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-300",
          "hover:scale-[1.01] hover:shadow-lg"
        )}
        whileTap={{ scale: 0.99 }}
      >
        <GlassCard className={cn("p-4", `bg-gradient-to-r ${config.bgGradient}`)}>
          {/* Tour label + Status */}
          <div className="flex items-center justify-between mb-3">
            <span className={cn("th-caption-2", config.color)}>
              {config.label}
            </span>
            
            <div className="flex items-center gap-2">
              {isLive && (
                <div className="flex items-center gap-1.5">
                  <LiveIndicator size="sm" />
                  <span className="text-[10px] font-bold text-[hsl(var(--th-accent-live))] uppercase">
                    LIVE
                  </span>
                </div>
              )}
              {status === 'upcoming' && (
                <span className="text-[10px] font-medium text-white/50 uppercase px-2 py-0.5 rounded-full bg-white/10">
                  UPCOMING
                </span>
              )}
              {isComplete && (
                <span className="text-[10px] font-medium text-emerald-400/80 uppercase px-2 py-0.5 rounded-full bg-emerald-500/10">
                  COMPLETE
                </span>
              )}
            </div>
          </div>

          {/* Tournament name */}
          <h3 className="text-white font-bold text-lg leading-tight mb-2">
            {tournament.name}
          </h3>

          {/* Venue */}
          <div className="flex items-center gap-1.5 text-white/60 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{tournament.venue_name || 'TBD'}</span>
          </div>

          {/* Round / Status row */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/70">
                {getRoundText(tournament)}
              </span>
              {/* Field size would come from leaderboard data */}
            </div>

            {/* Winner for complete, or leader for live */}
            {isComplete && tournament.defending_champion && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[hsl(var(--th-accent-gold))]" />
                <span className="text-white/80 text-sm font-medium">
                  {tournament.defending_champion}
                </span>
              </div>
            )}
          </div>

          {/* Week progress indicator (for live) */}
          {isLive && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {['R1', 'R2', 'R3', 'R4'].map((round, index) => {
                  // Simplified - would need actual round data
                  const isCompleteRound = index < 2;
                  const isCurrentRound = index === 2;
                  
                  return (
                    <div
                      key={round}
                      className={cn(
                        "flex-1 h-1 rounded-full",
                        isCompleteRound && "bg-emerald-500",
                        isCurrentRound && "bg-white/70",
                        !isCompleteRound && !isCurrentRound && "bg-white/20"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {['Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <span key={day} className="text-[9px] text-white/40">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </Link>
  );
}

export function ThisWeekSection({ tournaments }: ThisWeekSectionProps) {
  // Get tournaments for this week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeekTournaments = tournaments.filter(t => {
    const start = parseISO(t.start_date);
    const end = parseISO(t.end_date);
    
    // Include if any part of tournament overlaps with this week
    return (
      isWithinInterval(start, { start: weekStart, end: weekEnd }) ||
      isWithinInterval(end, { start: weekStart, end: weekEnd }) ||
      (start <= weekStart && end >= weekEnd)
    );
  });

  // Also include live tournaments regardless of dates
  const liveTournaments = tournaments.filter(t => 
    t.status === 'inprogress' && 
    !thisWeekTournaments.find(tw => tw.id === t.id)
  );

  const allRelevant = [...thisWeekTournaments, ...liveTournaments];

  if (allRelevant.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      {/* Section header */}
      <div className="px-4 sm:px-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/50" />
          <h2 className="th-caption-2 text-white/70">
            THIS WEEK IN GOLF
          </h2>
        </div>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Full Schedule →
        </Link>
      </div>

      {/* Tournament cards */}
      <div className="px-4 sm:px-6 space-y-3">
        {allRelevant.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <TournamentRow 
              tournament={tournament} 
              tour="pga" // Would need tour info from data
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
