/**
 * ScheduleTournamentCard - Full-width cinematic event card
 * 
 * Features:
 * - Large hero image with gradient overlay
 * - Full-bleed edge-to-edge design
 * - Taller card height for impact
 * - Text overlay with strong hierarchy
 * - Neutral status badges (no orange)
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
  const config: Record<string, { label: string; pulse?: boolean; className: string }> = {
    inprogress: { 
      label: 'Live', 
      pulse: true,
      className: 'bg-slate-800 text-white'
    },
    scheduled: { 
      label: 'Upcoming',
      className: 'bg-slate-700/80 text-white'
    },
    created: { 
      label: 'Upcoming',
      className: 'bg-slate-700/80 text-white'
    },
    closed: { 
      label: 'Completed',
      className: 'bg-slate-600/70 text-white/90'
    },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
      c.className
    )}>
      {c.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
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
        "block relative w-full rounded-2xl overflow-hidden",
        "transition-all duration-200 ease-out",
        "active:scale-[0.98] hover:brightness-105",
        className
      )}
      style={{ height: '220px' }}
    >
      {/* Background Image or Slate Fallback */}
      {hasImage ? (
        <img 
          src={courseImage.imageUrl!}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}
      
      {/* Gradient Overlay - Transparent to Dark (top to bottom) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <StatusBadge status={tournament.status} />
      </div>
      
      {/* Content - Bottom with text hierarchy */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col">
        {/* Event Name - Headline */}
        <h3 className="font-display text-xl font-semibold text-white leading-tight line-clamp-2 mb-2">
          {tournament.name}
        </h3>
        
        {/* Date - Medium weight */}
        <p className="text-sm font-medium text-white/90 mb-1">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>
        
        {/* Location - Smallest with icon */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
