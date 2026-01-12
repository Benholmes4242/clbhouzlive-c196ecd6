/**
 * ScheduleTournamentCard - Premium tournament card with course image
 * 
 * Layout: Image Left (Option A)
 * - Left: Course thumbnail (80x80) with gradient fallback
 * - Right: Tournament info stacked
 * 
 * Structure:
 * - Name + Status badge (top right)
 * - Dates
 * - Venue location
 * - Stats pills: Purse (primary), Par, Yardage, Major badge
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
}

// Cinematic gradient patterns for fallback thumbnails
const thumbnailGradients = [
  'from-emerald-600 to-teal-700',
  'from-slate-600 to-zinc-700',
  'from-blue-600 to-indigo-700',
  'from-amber-600 to-orange-700',
  'from-violet-600 to-purple-700',
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    inprogress: { 
      bg: 'bg-red-500', 
      text: 'text-white', 
      label: 'Live',
      pulse: true
    },
    scheduled: { 
      bg: 'bg-emerald-500/15', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      label: 'Upcoming' 
    },
    created: { 
      bg: 'bg-emerald-500/15', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      label: 'Upcoming' 
    },
    closed: { 
      bg: 'bg-muted/60', 
      text: 'text-muted-foreground/70', 
      label: 'Completed' 
    },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
      c.bg, 
      c.text,
      c.pulse && 'animate-pulse'
    )}>
      {c.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      {c.label}
    </span>
  );
}

function MajorBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
      <Trophy className="w-3 h-3" />
      Major
    </span>
  );
}

export function ScheduleTournamentCard({ tournament, className }: ScheduleTournamentCardProps) {
  // Resolve course image
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const isMajor = tournament.name.toLowerCase().includes('open') || 
                  tournament.name.toLowerCase().includes('masters') ||
                  tournament.name.toLowerCase().includes('pga championship') ||
                  tournament.name.toLowerCase().includes('u.s. open');

  const hasImage = courseImage?.imageUrl && !imageLoading;
  const gradientIndex = tournament.name.length % thumbnailGradients.length;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "group flex gap-4 bg-card border border-border rounded-xl p-3 sm:p-4 transition-all duration-200",
        "shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-sm",
        className
      )}
    >
      {/* Course Image Thumbnail */}
      <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden">
        {hasImage ? (
          <img 
            src={courseImage.imageUrl!}
            alt={tournament.venue_name || tournament.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br",
            thumbnailGradients[gradientIndex]
          )}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id={`dots-${tournament.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="80" height="80" fill={`url(#dots-${tournament.id})`} />
              </svg>
            </div>
          </div>
        )}
        
        {/* Subtle overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top row: Name + Status */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {tournament.name}
          </h3>
          <StatusBadge status={tournament.status} />
        </div>
        
        {/* Dates */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </span>
        </div>
        
        {/* Venue */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
          {tournament.purse && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <span className="px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/70 text-xs font-medium">
              Par {tournament.venue_par}
            </span>
          )}
          {tournament.venue_yardage && (
            <span className="px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/70 text-xs font-medium">
              {tournament.venue_yardage.toLocaleString()} yds
            </span>
          )}
          {isMajor && <MajorBadge />}
        </div>
      </div>
    </Link>
  );
}
