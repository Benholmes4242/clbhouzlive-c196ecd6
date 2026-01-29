/**
 * ThisWeekSection - Multi-tour summary with timeline and status indicators
 * Light theme with dark cards for events
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Radio, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveIndicator } from '../premium/LiveIndicator';
import { useLiveEvents, useUpcomingEvents } from '../../hooks/useTourEvents';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface TourEvent {
  id: string;
  name: string;
  status: string;
  venue_name?: string | null;
  venue_city?: string | null;
  start_date: string;
  end_date: string;
  defending_champion?: string | null;
  purse?: number | null;
}

function detectTourName(event: TourEvent): string {
  const name = event.name?.toLowerCase() || '';
  if (name.includes('lpga') || name.includes("women's")) return 'LPGA TOUR';
  if (name.includes('liv')) return 'LIV GOLF';
  if (name.includes('dp world') || name.includes('european')) return 'DP WORLD TOUR';
  return 'PGA TOUR';
}

function getStatusInfo(event: TourEvent) {
  const startDate = new Date(event.start_date);
  
  if (event.status === 'inprogress') {
    return {
      type: 'live' as const,
      label: 'LIVE',
      icon: Radio,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    };
  }
  
  if (event.status === 'complete' || event.status === 'closed') {
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

function TourEventCard({ event }: { event: TourEvent }) {
  const tourName = detectTourName(event);
  const status = getStatusInfo(event);
  const StatusIcon = status.icon;
  
  return (
    <Link to={`/tourhub/tournament/${event.id}`}>
      <motion.div
        className={cn(
          "rounded-2xl border p-4 transition-colors",
          status.bgColor,
          status.borderColor,
          "hover:shadow-md"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Tour Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 tracking-wider">
            {tourName}
          </span>
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
        <h3 className="text-slate-800 font-semibold text-base mb-1">
          {event.name}
        </h3>
        
        {/* Venue */}
        <p className="text-slate-500 text-sm">
          {event.venue_name}
          {event.venue_city && ` • ${event.venue_city}`}
        </p>
        
        {/* Additional Info */}
        {event.defending_champion && status.type !== 'live' && (
          <p className="text-slate-400 text-xs mt-2">
            Defending: {event.defending_champion}
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
    <div className="flex items-center justify-between px-4 py-3 mb-4">
      {days.map((day, idx) => (
        <div key={day} className="flex flex-col items-center">
          <div className="flex items-center">
            {idx > 0 && (
              <div className={cn(
                "w-12 h-0.5 -mr-1",
                idx <= currentPosition ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
            <div className={cn(
              "w-3 h-3 rounded-full border-2",
              idx <= currentPosition 
                ? "bg-emerald-500 border-emerald-500" 
                : "bg-transparent border-slate-300"
            )} />
            {idx < days.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 -ml-1",
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

export function ThisWeekSection() {
  const { data: liveEvents, isLoading: liveLoading } = useLiveEvents();
  const { data: upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents(5);
  
  const isLoading = liveLoading || upcomingLoading;
  
  // Combine and dedupe events
  const allEvents = [...(liveEvents || []), ...(upcomingEvents || [])];
  const uniqueEvents = allEvents.filter((event, idx, arr) => 
    arr.findIndex(e => e.id === event.id) === idx
  ).slice(0, 4);

  if (isLoading) {
    return (
      <section className="py-8 px-4 bg-[#F8FAFC]">
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-[#F8FAFC]">
      {/* Header - Light theme */}
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
      <WeekTimeline />
      
      {/* Event Cards */}
      <div className="px-4 space-y-3">
        {uniqueEvents.map(event => (
          <TourEventCard key={event.id} event={event} />
        ))}
        
        {uniqueEvents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No events this week</p>
          </div>
        )}
      </div>
    </section>
  );
}
