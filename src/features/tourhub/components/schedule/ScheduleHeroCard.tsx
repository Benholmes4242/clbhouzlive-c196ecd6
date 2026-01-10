/**
 * ScheduleHeroCard - Featured tournament hero for Schedule tab
 * Matches FeaturedMomentCard visual language from Overview
 * 
 * Logic: Shows Live > Upcoming > Most Recent tournament
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
}

// Cinematic gradient patterns for fallback
const cinematicGradients = [
  'from-emerald-900/90 via-emerald-800/70 to-teal-900/80',
  'from-slate-900/90 via-slate-800/70 to-zinc-900/80',
  'from-amber-900/80 via-orange-900/60 to-yellow-900/70',
];

export function ScheduleHeroCard({ tournament, type }: ScheduleHeroCardProps) {
  const labelConfig = {
    live: { 
      text: 'Live now', 
      icon: <Zap className="w-3.5 h-3.5" />, 
      className: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
      pulse: true
    },
    upcoming: { 
      text: 'Next up', 
      icon: <Calendar className="w-3.5 h-3.5" />, 
      className: 'bg-primary/90 text-primary-foreground',
      pulse: false
    },
    recent: { 
      text: 'Most recent', 
      icon: <Clock className="w-3.5 h-3.5" />, 
      className: 'bg-muted/80 text-muted-foreground',
      pulse: false
    },
  };

  const label = labelConfig[type];
  const gradientIndex = tournament.name.length % cinematicGradients.length;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-xl"
    >
      {/* Image/Gradient Band */}
      <div className="relative h-28 sm:h-32 overflow-hidden">
        {/* Cinematic gradient fallback */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          cinematicGradients[gradientIndex]
        )} />
        
        {/* Course texture overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="schedule-course-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="400" height="130" fill="url(#schedule-course-dots)" />
            <path d="M0 80 Q100 60 200 80 T400 80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
            <path d="M0 100 Q100 80 200 100 T400 100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>
        
        {/* Gradient to card - softer transition with inner shadow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-4 shadow-[inset_0_-4px_8px_-4px_rgba(0,0,0,0.04)]" />

        {/* Type Label - positioned on image band, reduced height */}
        <div className="absolute top-3 left-3">
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
            label.className,
            label.pulse && "animate-pulse"
          )}>
            {label.icon}
            {label.text}
          </div>
        </div>

        {/* View Details CTA - slate text, subtle hover with chevron animation */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-xs font-medium transition-all group-hover:bg-white/25 group-hover:text-white">
            <span>View details</span>
            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Tournament Name */}
        <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {tournament.name}
        </h2>

        {/* Dates */}
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>

        {/* Venue */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
            <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city, tournament.venue_country].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* Stats Chips - Purse visually primary, Par/Yardage secondary */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {tournament.purse && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              ${(tournament.purse / 1_000_000).toFixed(1)}M Purse
            </span>
          )}
          {tournament.venue_par && (
            <span className="px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground/80 text-xs font-medium">
              Par {tournament.venue_par}
            </span>
          )}
          {tournament.venue_yardage && (
            <span className="px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground/80 text-xs font-medium">
              {tournament.venue_yardage.toLocaleString()} yds
            </span>
          )}
        </div>
      </div>
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
