/**
 * ThisWeekView - Multi-tour timeline showing live and upcoming events
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Radio, Clock, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveIndicator } from '../premium/LiveIndicator';
import { 
  useLiveTournaments, 
  useUpcomingTournaments, 
  TOUR_CONFIG,
  type TourTournament,
  type TourId 
} from '../../hooks/useOverviewData';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface ThisWeekViewProps {
  filterTour?: TourId | 'all';
}

function getStatusInfo(tournament: TourTournament) {
  const startDate = new Date(tournament.startDate);
  
  if (tournament.status === 'inprogress') {
    return {
      type: 'live' as const,
      label: 'LIVE',
      icon: Radio,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    };
  }
  
  if (tournament.status === 'closed') {
    return {
      type: 'complete' as const,
      label: 'COMPLETE',
      icon: CheckCircle2,
      color: 'text-slate-400',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
    };
  }
  
  // Upcoming
  if (isToday(startDate)) {
    return {
      type: 'upcoming' as const,
      label: 'TODAY',
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    };
  }
  
  if (isTomorrow(startDate)) {
    return {
      type: 'upcoming' as const,
      label: 'TOMORROW',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    };
  }
  
  const daysUntil = differenceInDays(startDate, new Date());
  return {
    type: 'upcoming' as const,
    label: daysUntil <= 7 ? `IN ${daysUntil} DAYS` : format(startDate, 'MMM d'),
    icon: Calendar,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  };
}

function TourEventCard({ tournament }: { tournament: TourTournament }) {
  const status = getStatusInfo(tournament);
  const StatusIcon = status.icon;
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  return (
    <Link to={`/tourhub/tournament/${tournament.id}`}>
      <motion.div
        className={cn(
          "rounded-2xl border p-4 transition-all",
          status.bgColor,
          status.borderColor,
          "hover:shadow-lg hover:scale-[1.01]"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Tour Label + Status */}
        <div className="flex items-center justify-between mb-2">
          <div 
            className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: tourConfig.color }}
          >
            {tourConfig.name.toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            {status.type === 'live' ? (
              <LiveIndicator size="sm" />
            ) : (
              <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
            )}
            <span className={cn("text-xs font-semibold", status.color)}>
              {status.label}
            </span>
          </div>
        </div>
        
        {/* Event Name */}
        <h3 className="text-slate-800 font-semibold text-base mb-1.5 line-clamp-1">
          {tournament.name}
        </h3>
        
        {/* Venue */}
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {tournament.venueName}
            {tournament.venueCity && ` • ${tournament.venueCity}`}
          </span>
        </div>
        
        {/* Purse */}
        {tournament.purse && (
          <p className="text-slate-400 text-xs mt-2">
            ${(tournament.purse / 1000000).toFixed(1)}M Purse
          </p>
        )}
      </motion.div>
    </Link>
  );
}

function WeekTimeline() {
  const days = ['Thu', 'Fri', 'Sat', 'Sun'];
  const rounds = ['R1', 'R2', 'R3', 'R4'];
  const today = new Date().getDay();
  
  // Map day of week to timeline position (Thu=4, Fri=5, Sat=6, Sun=0)
  const dayMap: Record<number, number> = { 4: 0, 5: 1, 6: 2, 0: 3 };
  const currentPosition = dayMap[today] ?? -1;
  
  return (
    <div className="flex items-center justify-between px-6 py-4 mb-4 bg-white rounded-2xl border border-slate-200">
      {days.map((day, idx) => (
        <div key={day} className="flex flex-col items-center">
          <div className="flex items-center">
            {idx > 0 && (
              <div className={cn(
                "w-10 sm:w-14 h-0.5 -mr-1",
                idx <= currentPosition ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
            <div className={cn(
              "w-3 h-3 rounded-full border-2 z-10",
              idx <= currentPosition 
                ? "bg-emerald-500 border-emerald-500" 
                : idx === currentPosition + 1
                  ? "bg-transparent border-emerald-500"
                  : "bg-transparent border-slate-300"
            )} />
            {idx < days.length - 1 && (
              <div className={cn(
                "w-10 sm:w-14 h-0.5 -ml-1",
                idx < currentPosition ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
          </div>
          <span className={cn(
            "text-xs font-medium mt-2",
            idx === currentPosition ? "text-emerald-600" : "text-slate-500"
          )}>
            {day}
          </span>
          <span className="text-[10px] text-slate-400">{rounds[idx]}</span>
        </div>
      ))}
    </div>
  );
}

export function ThisWeekView({ filterTour = 'all' }: ThisWeekViewProps) {
  const { data: liveTournaments, isLoading: liveLoading } = useLiveTournaments();
  const { data: upcomingTournaments, isLoading: upcomingLoading } = useUpcomingTournaments(14);
  
  const isLoading = liveLoading || upcomingLoading;

  // Combine and filter
  const allTournaments = [
    ...(liveTournaments || []),
    ...(upcomingTournaments || []),
  ];

  // Remove duplicates and filter by tour
  const uniqueTournaments = allTournaments
    .filter((t, idx, arr) => arr.findIndex(x => x.id === t.id) === idx)
    .filter(t => filterTour === 'all' || t.tourSlug === filterTour)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section className="py-6 px-4 bg-[#F8FAFC]">
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-slate-800 text-lg font-semibold">This Week in Golf</h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Full Schedule
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      {/* Week Timeline */}
      <div className="px-4">
        <WeekTimeline />
      </div>
      
      {/* Event Cards - Staggered Grid */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {uniqueTournaments.map((tournament, idx) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <TourEventCard tournament={tournament} />
          </motion.div>
        ))}
        
        {uniqueTournaments.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-400 text-sm">No events this week</p>
          </div>
        )}
      </div>
    </section>
  );
}
