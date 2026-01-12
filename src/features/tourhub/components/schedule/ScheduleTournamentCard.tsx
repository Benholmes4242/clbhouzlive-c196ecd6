/**
 * ScheduleTournamentCard - Full-width cinematic card
 * 
 * Course image as background with dark gradient overlay
 * All text in white for legibility
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; pulse?: boolean }> = {
    inprogress: { label: 'Live', pulse: true },
    scheduled: { label: 'Upcoming' },
    created: { label: 'Upcoming' },
    closed: { label: 'Completed' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      'bg-white/20 text-white backdrop-blur-sm'
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

export function ScheduleTournamentCard({ tournament, className }: ScheduleTournamentCardProps) {
  // Resolve course image
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const hasImage = courseImage?.imageUrl && !imageLoading;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "block relative -mr-4 h-[150px]",
        "transition-all duration-300 ease-out",
        "hover:brightness-110",
        className
      )}
    >
      {/* Background Image or Grey Fallback - edge to edge */}
      {hasImage ? (
        <img 
          src={courseImage.imageUrl!}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-300" />
      )}
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-4 z-10">
        <StatusBadge status={tournament.status} />
      </div>
      
      {/* Content - Bottom with internal padding */}
      <div className="absolute inset-0 px-4 py-4 flex flex-col justify-end">
        {/* Tournament Name */}
        <h3 className="text-lg font-semibold text-white leading-tight line-clamp-1 mb-1">
          {tournament.name}
        </h3>
        
        {/* Date */}
        <p className="text-sm text-white/80 mb-1">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>
        
        {/* Venue */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-white/70 mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
          {tournament.purse && (
            <span className="font-semibold text-emerald-400">
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <>
              <span className="text-white/40">•</span>
              <span>Par {tournament.venue_par}</span>
            </>
          )}
          {tournament.venue_yardage && (
            <>
              <span className="text-white/40">•</span>
              <span>{tournament.venue_yardage.toLocaleString()} yds</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
