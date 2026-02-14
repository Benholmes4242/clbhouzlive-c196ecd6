/**
 * ThisWeekView - Clean list layout with full-bleed rows (Apple-grade)
 * No cards, subtle dividers, full touch targets
 */

import { Link, useNavigate } from 'react-router-dom';
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

// Simplified round progress bar
function RoundProgress() {
  const rounds = ['R1', 'R2', 'R3', 'R4'];
  const today = new Date().getDay();
  
  // Map day of week to round (Thu=0, Fri=1, Sat=2, Sun=3)
  const dayMap: Record<number, number> = { 4: 0, 5: 1, 6: 2, 0: 3 };
  const currentRound = dayMap[today] ?? -1;

  return (
    <div className="flex items-center gap-1 mb-6">
      {rounds.map((round, i) => (
        <div key={round} className="flex-1 flex flex-col items-center">
          <div className={cn(
            "w-full h-1 rounded-full mb-2",
            i < currentRound ? "bg-emerald-500" : 
            i === currentRound ? "bg-emerald-500" : "bg-slate-200"
          )} />
          <span className={cn(
            "text-xs font-medium",
            i <= currentRound ? "text-emerald-600" : "text-slate-400"
          )}>{round}</span>
        </div>
      ))}
    </div>
  );
}

// Individual tournament row with leader fetch
function TournamentRow({ tournament, isLive, index }: { 
  tournament: TourTournament; 
  isLive: boolean;
  index: number;
}) {
  const navigate = useNavigate();
  const { data: leader } = useTournamentLeader(isLive ? tournament.id : undefined);
  
  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full flex items-start gap-3 px-4 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0 text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {/* Tour Logo */}
      <img 
        src={getTourLogo(tournament.tourSlug)}
        alt={TOUR_CONFIG[tournament.tourSlug]?.name || 'Tour'}
        className="w-8 h-6 object-contain flex-shrink-0 mt-0.5"
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 text-[15px] leading-snug line-clamp-2">
            {tournament.name}
          </h3>
          {isLive ? (
            <span className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: '#34C759' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34C759' }} />
              LIVE
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex-shrink-0">
              {getTimeUntil(tournament.startDate)}
            </span>
          )}
        </div>
        
        <p className="text-sm text-slate-500 mt-0.5">
          {tournament.venueName}
          {tournament.venueCity && ` · ${tournament.venueCity}`}
        </p>
        
        {isLive && leader ? (
          <p className="text-sm font-medium mt-1" style={{ color: '#E09F3E' }}>
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
      
      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
    </motion.button>
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
      <section className="py-6 bg-[#F8FAFC]">
        <div className="px-4 mb-5">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-1 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 px-4 py-4 border-b border-slate-100">
              <div className="w-8 h-6 bg-slate-200 rounded animate-pulse" />
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
    <section className="py-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-5">
        <h2 className="text-xl font-bold text-slate-900">This Week</h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors"
        >
          Full Schedule
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Round Progress - Simplified */}
      <div className="px-4">
        <RoundProgress />
      </div>
      
      {/* Tournament List - Full Bleed Rows */}
      <div className="space-y-0 -mx-0">
        {filteredTournaments.map((tournament, idx) => (
          <TournamentRow 
            key={tournament.id}
            tournament={tournament} 
            isLive={allLive.has(tournament.id)}
            index={idx}
          />
        ))}
        
        {filteredTournaments.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-slate-400 text-sm">No events this week</p>
          </div>
        )}
      </div>
    </section>
  );
}
