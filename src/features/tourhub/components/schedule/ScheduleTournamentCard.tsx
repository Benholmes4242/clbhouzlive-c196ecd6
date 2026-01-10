/**
 * ScheduleTournamentCard - Premium tournament card for timeline
 * Improved hierarchy matching Overview visual language
 * 
 * Structure:
 * - Top row: Tournament name (bold) + Status pill
 * - Middle: Dates + Course name + city
 * - Bottom row: Purse (primary), Par, Yardage (secondary)
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    inprogress: { 
      bg: 'bg-emerald-500/15', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      label: 'Live',
      pulse: true
    },
    scheduled: { 
      bg: 'bg-primary/10', 
      text: 'text-primary', 
      label: 'Upcoming' 
    },
    created: { 
      bg: 'bg-primary/10', 
      text: 'text-primary', 
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
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      c.bg, 
      c.text,
      c.pulse && 'animate-pulse'
    )}>
      {c.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {c.label}
    </span>
  );
}

export function ScheduleTournamentCard({ tournament, className }: ScheduleTournamentCardProps) {
  const isMajor = tournament.name.toLowerCase().includes('open') || 
                  tournament.name.toLowerCase().includes('masters') ||
                  tournament.name.toLowerCase().includes('pga championship') ||
                  tournament.name.toLowerCase().includes('u.s. open');

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "block bg-card border border-border rounded-xl p-4 sm:p-5 transition-all duration-200",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-md",
        className
      )}
    >
      {/* Top row: Name + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
            {tournament.name}
          </h3>
        </div>
        <StatusBadge status={tournament.status} />
      </div>
      
      {/* Middle: Dates + Venue */}
      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </span>
        </div>
        
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom row: Stats pills - Purse primary, Par/Yardage secondary */}
      <div className="flex flex-wrap items-center gap-2">
        {tournament.purse && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            ${(tournament.purse / 1_000_000).toFixed(1)}M
          </span>
        )}
        {tournament.venue_par && (
          <span className="px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground/70 text-xs font-medium">
            Par {tournament.venue_par}
          </span>
        )}
        {tournament.venue_yardage && (
          <span className="px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground/70 text-xs font-medium">
            {tournament.venue_yardage.toLocaleString()} yds
          </span>
        )}
        {isMajor && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
            Major
          </span>
        )}
      </div>
    </Link>
  );
}
