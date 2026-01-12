/**
 * ScheduleTournamentCard - Editorial layout (no card container)
 * 
 * Clean row layout with:
 * - Larger course image (140x100) with rounded corners
 * - No card background, shadow, or border
 * - Subtle divider between items
 * - Hover: background tint only
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
  showDivider?: boolean;
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
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-700 dark:text-emerald-400', 
      label: 'Upcoming' 
    },
    created: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-700 dark:text-emerald-400', 
      label: 'Upcoming' 
    },
    closed: { 
      bg: 'bg-zinc-100 dark:bg-zinc-800', 
      text: 'text-zinc-500 dark:text-zinc-400', 
      label: 'Completed' 
    },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
      c.bg, 
      c.text
    )}>
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {c.label}
    </span>
  );
}

function MajorBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
      <Trophy className="w-3 h-3" />
      Major
    </span>
  );
}

export function ScheduleTournamentCard({ tournament, className, showDivider = true }: ScheduleTournamentCardProps) {
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
    <div className={cn("relative", className)}>
      <Link
        to={`/tourhub/tournament/${tournament.id}`}
        className={cn(
          "group flex gap-4 py-4 px-2 -mx-2 rounded-lg transition-colors duration-200",
          "hover:bg-white/60 dark:hover:bg-white/5"
        )}
      >
        {/* Course Image Thumbnail - Larger 140x100 */}
        <div className="relative shrink-0 w-[140px] h-[100px] rounded-lg overflow-hidden">
          {hasImage ? (
            <img 
              src={courseImage.imageUrl!}
              alt={tournament.venue_name || tournament.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={cn(
              "w-full h-full bg-gradient-to-br",
              thumbnailGradients[gradientIndex]
            )}>
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 140 100" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id={`dots-${tournament.id}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                      <circle cx="7" cy="7" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="140" height="100" fill={`url(#dots-${tournament.id})`} />
                </svg>
              </div>
            </div>
          )}
          
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Top row: Name + Status */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {tournament.name}
            </h3>
            <StatusBadge status={tournament.status} />
          </div>
          
          {/* Dates */}
          <p className="text-sm text-muted-foreground mb-1">
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </p>
          
          {/* Venue */}
          {(tournament.venue_name || tournament.venue_city) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
              <span className="truncate">
                {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}
          
          {/* Stats row - separated by dots */}
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {tournament.purse && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${(tournament.purse / 1_000_000).toFixed(1)}M
              </span>
            )}
            {tournament.venue_par && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground">Par {tournament.venue_par}</span>
              </>
            )}
            {tournament.venue_yardage && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground">{tournament.venue_yardage.toLocaleString()} yds</span>
              </>
            )}
            {isMajor && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <MajorBadge />
              </>
            )}
          </div>
        </div>
      </Link>
      
      {/* Subtle divider */}
      {showDivider && (
        <div className="absolute bottom-0 left-[156px] right-0 h-px bg-border/50" />
      )}
    </div>
  );
}
