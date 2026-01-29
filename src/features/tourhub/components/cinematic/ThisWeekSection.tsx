/**
 * ThisWeekSection - Multi-tour summary with timeline and status indicators
 * Shows what's happening across all tours this week
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
      color: 'text-white/50',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
    };
  }
  
  // Upcoming
  if (isToday(startDate)) {
    return {
      type: 'upcoming' as const,
      label: 'TODAY',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    };
  }
  
  if (isTomorrow(startDate)) {
    return {
      type: 'upcoming' as const,
      label: 'TOMORROW',
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    };
  }
  
  const daysUntil = differenceInDays(startDate, new Date());
  return {
    type: 'upcoming' as const,
    label: daysUntil <= 7 ? `IN ${daysUntil} DAYS` : format(startDate, 'MMM d'),
    icon: Calendar,
    color: 'text-white/60',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
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
          "hover:bg-white/10"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Tour Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/40 tracking-wider">
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
        <h3 className="text-white font-semibold text-base mb-1">
          {event.name}
        </h3>
        
        {/* Venue */}
        <p className="text-white/50 text-sm">
          {event.venue_name}
          {event.venue_city && ` • ${event.venue_city}`}
        </p>
        
        {/* Additional Info */}
        {event.defending_champion && status.type !== 'live' && (
          <p className="text-white/40 text-xs mt-2">
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
                idx <= currentPosition ? "bg-emerald-500" : "bg-white/20"
              )} />
            )}
            <div className={cn(
              "w-3 h-3 rounded-full border-2",
              idx <= currentPosition 
                ? "bg-emerald-500 border-emerald-500" 
                : "bg-transparent border-white/30"
            )} />
            {idx < days.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 -ml-1",
                idx < currentPosition ? "bg-emerald-500" : "bg-white/20"
              )} />
            )}
          </div>
          <span className={cn(
            "text-xs font-medium mt-2",
            idx === currentPosition ? "text-emerald-400" : "text-white/50"
          )}>
            {day}
          </span>
          <span className="text-[10px] text-white/30">{rounds[idx]}</span>
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
      <section className="py-8 px-4" style={{ background: 'var(--th-bg-canvas, #000)' }}>
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8" style={{ background: 'var(--th-bg-canvas, #000)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-white text-lg font-semibold">This Week in Golf</h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
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
            <p className="text-white/40 text-sm">No events this week</p>
          </div>
        )}
      </div>
    </section>
  );
}
