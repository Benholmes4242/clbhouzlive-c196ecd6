import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../hooks/useTourHubData';

interface TournamentCardProps {
  tournament: TourTournament;
  className?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    inprogress: { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400', label: 'Live' },
    scheduled: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', label: 'Scheduled' },
    created: { bg: 'bg-gray-500/10', text: 'text-muted-foreground', label: 'Created' },
    closed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Completed' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {c.label}
    </span>
  );
}

export function TournamentCard({ tournament, className }: TournamentCardProps) {
  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn(
        "block bg-card border border-border rounded-xl p-5 transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
          {tournament.name}
        </h3>
        <StatusBadge status={tournament.status} />
      </div>
      
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </span>
        </div>
        
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        
        {tournament.purse && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>${(tournament.purse / 1_000_000).toFixed(1)}M Purse</span>
          </div>
        )}
      </div>
      
      {tournament.venue_par && tournament.venue_yardage && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 text-xs text-muted-foreground">
          <span>Par {tournament.venue_par}</span>
          <span className="text-border">•</span>
          <span>{tournament.venue_yardage.toLocaleString()} yards</span>
        </div>
      )}
    </Link>
  );
}
