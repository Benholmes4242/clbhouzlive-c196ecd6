/**
 * ScheduleTimeline - Horizontal Tournament Timeline
 * 
 * Design: Flat horizontal scroll with status pills (LIVE/THIS WEEK/UPCOMING)
 * No cards, no shadows - flat sections with dividers
 * Per redesign brief: Apple Fitness / The Athletic style
 */

import { useNavigate } from 'react-router-dom';
import { useUpcomingTournaments, ScheduledTournament } from '../../hooks/useTournamentSchedule';
import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/** Status pill styling based on tournament status */
const StatusPill = ({ tournament }: { tournament: ScheduledTournament }) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  
  // Check if tournament is live
  const isLive = now >= startDate && now <= endDate;
  
  // Check if this week (within 7 days)
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isThisWeek = daysUntil >= 0 && daysUntil <= 7 && !isLive;
  
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        Live
      </span>
    );
  }
  
  if (isThisWeek) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
        This Week
      </span>
    );
  }
  
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium uppercase tracking-wide">
      Upcoming
    </span>
  );
};

/** Tournament type badge */
const TournamentTypeBadge = ({ tournament }: { tournament: ScheduledTournament }) => {
  if (tournament.isMajor) {
    return (
      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase">
        Major
      </span>
    );
  }
  if (tournament.isPlayersChampionship) {
    return (
      <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[9px] font-bold uppercase">
        Players
      </span>
    );
  }
  if (tournament.isSignature) {
    return (
      <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[9px] font-bold uppercase">
        Signature
      </span>
    );
  }
  return null;
};

/** Individual tournament item in the timeline */
const TournamentItem = ({ 
  tournament, 
  onTap,
  index,
}: { 
  tournament: ScheduledTournament; 
  onTap: () => void;
  index: number;
}) => {
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  
  const formatDateRange = () => {
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  return (
    <motion.button
      onClick={onTap}
      className="flex-shrink-0 w-[200px] px-4 py-3 text-left border-r border-slate-100 last:border-r-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {/* Status + Type Pills */}
      <div className="flex items-center gap-1.5 mb-2">
        <StatusPill tournament={tournament} />
        <TournamentTypeBadge tournament={tournament} />
      </div>
      
      {/* Tournament Name */}
      <h3 className="font-semibold text-[15px] text-slate-900 leading-tight mb-1 line-clamp-2">
        {tournament.name}
      </h3>
      
      {/* Date Range */}
      <p className="text-[13px] text-slate-600 mb-1.5">
        {formatDateRange()}
      </p>
      
      {/* Location */}
      <div className="flex items-center gap-1 text-[12px] text-slate-500 mb-2">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">
          {tournament.venueName}
          {tournament.state && `, ${tournament.state}`}
        </span>
      </div>
      
      {/* Purse */}
      <p className="text-[12px] font-medium text-slate-400">
        {tournament.purseFormatted}
      </p>
    </motion.button>
  );
};

/** Loading skeleton */
const TimelineSkeleton = () => (
  <div className="flex gap-0 px-0 overflow-hidden">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex-shrink-0 w-[200px] px-4 py-3 border-r border-slate-100">
        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse mb-2" />
        <div className="h-5 w-full bg-slate-100 rounded animate-pulse mb-1" />
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-1.5" />
        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse mb-2" />
        <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export function ScheduleTimeline() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useUpcomingTournaments(20);

  // Empty state - don't render if no tournaments
  if (!isLoading && (!tournaments || tournaments.length === 0)) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Upcoming & Live</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Tournament Schedule</p>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="text-sm font-semibold text-slate-600 flex items-center gap-1 hover:text-slate-900 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Timeline */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : (
        <div 
          className="flex overflow-x-auto scrollbar-hide pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Left padding spacer */}
          <div className="flex-shrink-0 w-0" />
          
          {tournaments!.map((tournament, index) => (
            <TournamentItem
              key={tournament.id}
              tournament={tournament}
              index={index}
              onTap={() => navigate(`/tourhub/tournament/${tournament.id}`)}
            />
          ))}
          
          {/* Right padding spacer */}
          <div className="flex-shrink-0 w-4" />
        </div>
      )}
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-4" />
    </section>
  );
}

export default ScheduleTimeline;
