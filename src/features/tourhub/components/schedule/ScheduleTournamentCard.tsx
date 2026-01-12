/**
 * ScheduleTournamentCard - Full-width cinematic card with flowing design
 * 
 * Features:
 * - Major Championship treatment (taller, richer, more gravitas)
 * - Global Chapter styling (Ryder Cup, Olympics)
 * - Completed events dimmed as history
 * - Subtle status badges
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

// Major championships allowlist
const MAJOR_KEYWORDS = [
  'masters tournament',
  'the masters',
  'pga championship',
  'u.s. open',
  'us open',
  'the open championship',
  'the open',
  'british open',
];

// Global chapter events
const GLOBAL_CHAPTER_KEYWORDS = [
  'ryder cup',
  'presidents cup',
  'olympic',
  'olympics',
  'solheim cup',
];

function isMajor(name: string): boolean {
  const lower = name.toLowerCase();
  return MAJOR_KEYWORDS.some(k => lower.includes(k));
}

function isGlobalChapter(name: string): boolean {
  const lower = name.toLowerCase();
  return GLOBAL_CHAPTER_KEYWORDS.some(k => lower.includes(k));
}

function StatusBadge({ status, isMajor, isGlobal, eventName }: { 
  status: string; 
  isMajor: boolean;
  isGlobal: boolean;
  eventName: string;
}) {
  // Special badges for major/global events
  if (isMajor) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        'bg-amber-900/40 text-amber-100/90 backdrop-blur-md border border-amber-400/20'
      )}>
        Major Championship
      </span>
    );
  }
  
  if (isGlobal) {
    const label = eventName.toLowerCase().includes('ryder') ? 'Ryder Cup' :
                  eventName.toLowerCase().includes('olympic') ? 'Olympic Games' :
                  eventName.toLowerCase().includes('presidents') ? 'Presidents Cup' :
                  eventName.toLowerCase().includes('solheim') ? 'Solheim Cup' : 'Global Event';
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        'bg-slate-800/50 text-slate-100/90 backdrop-blur-md border border-slate-400/20'
      )}>
        {label}
      </span>
    );
  }

  const config: Record<string, { label: string; pulse?: boolean }> = {
    inprogress: { label: 'Live', pulse: true },
    scheduled: { label: 'Upcoming' },
    created: { label: 'Upcoming' },
    closed: { label: 'Final' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
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
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const hasImage = courseImage?.imageUrl && !imageLoading;
  const isCompleted = tournament.status === 'closed';
  const major = isMajor(tournament.name);
  const global = isGlobalChapter(tournament.name);

  // Card height varies by event type
  const cardHeight = major ? 'h-[160px]' : global ? 'h-[150px]' : 'h-[140px]';

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "block relative -mr-4",
        cardHeight,
        "transition-all duration-300 ease-out",
        isCompleted ? "hover:brightness-100" : "hover:brightness-105",
        className
      )}
      style={{
        boxShadow: major 
          ? 'inset 0 0 60px rgba(0,0,0,0.15)' 
          : 'inset 0 0 40px rgba(0,0,0,0.08)',
        filter: isCompleted ? 'saturate(0.85) brightness(0.92)' : undefined,
      }}
    >
      {/* Background Image or Grey Fallback */}
      {hasImage ? (
        <img 
          src={courseImage.imageUrl!}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn(
          "absolute inset-0",
          global ? "bg-slate-700" : "bg-gray-300"
        )} />
      )}
      
      {/* Top vignette */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-12 bg-gradient-to-b to-transparent",
        major ? "from-black/40" : "from-black/25"
      )} />
      
      {/* Edge vignettes for majors */}
      {major && (
        <>
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent" />
        </>
      )}
      
      {/* Bottom gradient overlay - darker for majors */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t to-transparent",
        major ? "from-black via-black/50" : 
        global ? "from-slate-900/90 via-slate-900/40" :
        "from-black/70 via-black/30"
      )} />
      
      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-4 z-10">
        <StatusBadge 
          status={tournament.status} 
          isMajor={major}
          isGlobal={global}
          eventName={tournament.name}
        />
      </div>
      
      {/* Content */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end",
        major ? "px-5 py-4" : "px-4 py-3"
      )}>
        {/* Tournament Name - larger for majors */}
        <h3 className={cn(
          "font-semibold text-white leading-tight line-clamp-1 mb-0.5",
          major ? "text-xl" : "text-lg"
        )}>
          {tournament.name}
        </h3>
        
        {/* Date */}
        <p className="text-sm text-white/90 mb-0.5">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>
        
        {/* Venue */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-white/70 mb-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Stats row - hide purse for global events */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/60">
          {tournament.purse && !global && (
            <span className={cn(
              "text-emerald-400/90",
              major ? "font-bold" : "font-medium"
            )}>
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <>
              {tournament.purse && !global && <span className="text-white/30">•</span>}
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

// Export helper functions for use in parent components
export { isMajor, isGlobalChapter };
