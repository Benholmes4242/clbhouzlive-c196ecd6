/**
 * ScheduleTournamentCard - Full-width cinematic card with flowing design
 * 
 * Features:
 * - Course image as background with softer gradient overlay
 * - Vignette effects for seamless transitions
 * - Subtle status badge
 * - Improved text hierarchy
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
  const config: Record<string, { label: string; pulse?: boolean; isCompleted?: boolean }> = {
    inprogress: { label: 'Live', pulse: true },
    scheduled: { label: 'Upcoming' },
    created: { label: 'Upcoming' },
    closed: { label: 'Final', isCompleted: true },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      // Softer, more translucent badge
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
      'bg-black/20 text-white/80 backdrop-blur-md border border-white/10'
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
  const isCompleted = tournament.status === 'closed';

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "block relative -mr-4 h-[140px]",
        "transition-all duration-300 ease-out",
        // Completed events feel like history - slightly dimmed
        isCompleted ? "hover:brightness-100" : "hover:brightness-105",
        className
      )}
      style={{
        // Subtle inner shadow for softer edges + completed dimming
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.08)',
        filter: isCompleted ? 'saturate(0.85) brightness(0.92)' : undefined,
      }}
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
      
      {/* Top vignette - subtle fade in from top */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/25 to-transparent" />
      
      {/* Bottom gradient overlay - slightly lighter */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Status Badge - Top Right, more subtle */}
      <div className="absolute top-2.5 right-4 z-10">
        <StatusBadge status={tournament.status} />
      </div>
      
      {/* Content - Bottom with internal padding */}
      <div className="absolute inset-0 px-4 py-3 flex flex-col justify-end">
        {/* Tournament Name */}
        <h3 className="text-lg font-semibold text-white leading-tight line-clamp-1 mb-0.5">
          {tournament.name}
        </h3>
        
        {/* Date - slightly brighter */}
        <p className="text-sm text-white/90 mb-0.5">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>
        
        {/* Venue - medium opacity */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-white/70 mb-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Stats row - most subtle */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/60">
          {tournament.purse && (
            <span className="font-medium text-emerald-400/90">
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <>
              <span className="text-white/30">•</span>
              <span>Par {tournament.venue_par}</span>
            </>
          )}
          {tournament.venue_yardage && (
            <>
              <span className="text-white/30">•</span>
              <span>{tournament.venue_yardage.toLocaleString()} yds</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
