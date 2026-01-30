/**
 * ThisWeekView - Clean timeline layout (Apple-grade, no cards)
 * Tour logos + clean rows with subtle dividers
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useLiveTournaments, 
  useUpcomingTournaments,
  useTournamentLeader, 
  TOUR_CONFIG,
  type TourTournament,
  type TourId 
} from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface ThisWeekViewProps {
  filterTour?: TourId | 'all';
}

function getTimeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  const days = differenceInDays(date, new Date());
  if (days <= 7) return `In ${days} days`;
  return format(date, 'MMM d');
}

function formatPurse(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M Purse`;
  }
  return `$${(purse / 1000).toFixed(0)}K Purse`;
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

// Timeline progress dots
function RoundTimeline() {
  const days = ['Thu', 'Fri', 'Sat', 'Sun'];
  const rounds = ['R1', 'R2', 'R3', 'R4'];
  const today = new Date().getDay();
  
  // Map day of week to timeline position
  const dayMap: Record<number, number> = { 4: 0, 5: 1, 6: 2, 0: 3 };
  const currentPosition = dayMap[today] ?? -1;

  return (
    <div className="flex items-center justify-between mb-6">
      {rounds.map((round, idx) => (
        <div key={round} className="flex flex-col items-center relative">
          {/* Connecting line (before dot) */}
          {idx > 0 && (
            <div 
              className={cn(
                "absolute right-1/2 top-1.5 w-full h-0.5 -translate-y-1/2",
                idx <= currentPosition ? "bg-emerald-500" : "bg-slate-200"
              )}
              style={{ width: 'calc(100% + 1.5rem)', right: '50%' }}
            />
          )}
          
          {/* Dot */}
          <div className={cn(
            "w-3 h-3 rounded-full border-2 z-10 bg-white",
            idx < currentPosition 
              ? "bg-emerald-500 border-emerald-500" 
              : idx === currentPosition
                ? "border-emerald-500 bg-emerald-500"
                : "border-slate-300"
          )} />
          
          {/* Labels */}
          <span className={cn(
            "text-xs font-medium mt-1.5",
            idx === currentPosition ? "text-emerald-600" : "text-slate-500"
          )}>
            {round}
          </span>
          <span className="text-[10px] text-slate-400">{days[idx]}</span>
        </div>
      ))}
    </div>
  );
}

// Individual tournament row with leader fetch
function TournamentRow({ tournament, isLive }: { tournament: TourTournament; isLive: boolean }) {
  const { data: leader } = useTournamentLeader(isLive ? tournament.id : undefined);
  
  return (
    <Link to={`/tourhub/tournament/${tournament.id}`}>
      <motion.div 
        className="flex items-start gap-4 py-4 border-t border-slate-100 first:border-t-0 active:bg-slate-50 transition-colors"
        whileTap={{ scale: 0.99 }}
      >
        {/* Tour Logo */}
        <img 
          src={getTourLogo(tournament.tourSlug)}
          alt={TOUR_CONFIG[tournament.tourSlug]?.name || 'Tour'}
          className="w-10 h-6 object-contain flex-shrink-0 mt-1"
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-[15px] leading-tight">
              {tournament.name}
            </h3>
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                {getTimeUntil(tournament.startDate)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-500 mt-0.5">
            {tournament.venueName}
            {tournament.venueCity && ` · ${tournament.venueCity}`}
          </p>
          
          {isLive && leader ? (
            <p className="text-sm text-emerald-600 font-medium mt-1">
              Leader: {leader.player.firstName[0]}. {leader.player.lastName} {leader.scoreDisplay}
            </p>
          ) : (
            tournament.purse && (
              <p className="text-sm text-slate-400 mt-1">
                {formatPurse(tournament.purse)}
              </p>
            )
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function ThisWeekView({ filterTour = 'all' }: ThisWeekViewProps) {
  const { data: liveTournaments, isLoading: liveLoading } = useLiveTournaments();
  const { data: upcomingTournaments, isLoading: upcomingLoading } = useUpcomingTournaments(14);
  
  const isLoading = liveLoading || upcomingLoading;

  // Combine and dedupe
  const allLive = new Set((liveTournaments || []).map(t => t.id));
  const allTournaments = [
    ...(liveTournaments || []),
    ...(upcomingTournaments || []).filter(t => !allLive.has(t.id)),
  ];

  // Filter by tour
  const filteredTournaments = allTournaments
    .filter(t => filterTour === 'all' || t.tourSlug === filterTour)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section className="px-4 py-6 bg-[#F8FAFC]">
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-6 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          This Week
        </h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Full Schedule →
        </Link>
      </div>
      
      {/* Round Progress Timeline */}
      <RoundTimeline />
      
      {/* Tournament List - NO CARDS */}
      <div className="space-y-0">
        {filteredTournaments.map((tournament, idx) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
          >
            <TournamentRow 
              tournament={tournament} 
              isLive={allLive.has(tournament.id)}
            />
          </motion.div>
        ))}
        
        {filteredTournaments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No events this week</p>
          </div>
        )}
      </div>
    </section>
  );
}
