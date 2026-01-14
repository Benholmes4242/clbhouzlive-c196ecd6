/**
 * ScheduleTournamentCard - Premium tournament card (world-class polish)
 * 
 * Features:
 * - 200px height, 16px radius
 * - Strong gradient overlay for text legibility
 * - High-contrast status badges with checkmark/pulse indicators
 * - Micro-icons for stats
 * - Chevron in faint circle for tap affordance
 * - Press state with subtle scale and shadow
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; pulse?: boolean; icon?: React.ReactNode; className: string }> = {
    inprogress: { 
      label: 'LIVE', 
      pulse: true,
      className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
    },
    scheduled: { 
      label: 'Upcoming',
      className: 'bg-slate-800/90 text-white'
    },
    created: { 
      label: 'Upcoming',
      className: 'bg-slate-800/90 text-white'
    },
    closed: { 
      label: 'Completed',
      icon: <Check className="w-3 h-3" />,
      className: 'bg-slate-700/80 text-white/90'
    },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide',
      c.className
    )}>
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {c.icon}
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
        "block relative w-full overflow-hidden mx-4",
        "transition-all duration-200 ease-out",
        "active:scale-[0.99]",
        className
      )}
      style={{ 
        height: '200px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      }}
    >
      {/* Background Image or Slate Fallback */}
      {hasImage ? (
        <img 
          src={courseImage.imageUrl!}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}
      
      {/* Strong gradient overlay - bottom-heavy for text legibility */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.10) 100%)',
        }}
      />
      
      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <StatusBadge status={tournament.status} />
      </div>

      {/* Tap affordance - chevron in faint circle */}
      <div 
        className="absolute right-3 bottom-3 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <ChevronRight className="w-4 h-4 text-white/80" />
      </div>
      
      {/* Content - Bottom with text hierarchy */}
      <div className="absolute inset-x-0 bottom-0 p-4 pr-14 flex flex-col">
        {/* Event Name - Headline */}
        <h3 
          className="font-bold text-white leading-tight line-clamp-2 mb-1.5"
          style={{ 
            fontSize: '18px',
            letterSpacing: '-0.3px',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {tournament.name}
        </h3>
        
        {/* Date - Medium weight */}
        <p className="text-[13px] font-medium text-white/90 mb-1">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>
        
        {/* Location - Smallest with icon */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-[12px] text-white/70 mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* Meta Info - Purse, Par, Yardage with icons */}
        <div className="flex items-center gap-3 text-[11px] text-white/80">
          {tournament.purse && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 opacity-70" />
              <span className="font-semibold">
                {(tournament.purse / 1_000_000).toFixed(1)}M
              </span>
            </div>
          )}
          {tournament.venue_par && (
            <div className="flex items-center gap-1">
              <Flag className="w-3 h-3 opacity-70" />
              <span>Par {tournament.venue_par}</span>
            </div>
          )}
          {tournament.venue_yardage && (
            <div className="flex items-center gap-1">
              <Ruler className="w-3 h-3 opacity-70" />
              <span>{tournament.venue_yardage.toLocaleString()} yds</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
