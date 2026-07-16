import { Link } from 'react-router-dom';
import { formatTournamentDateRange } from '@/i18n/format';
import { StatusChip } from './StatusChip';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface EventCardProps {
  id: string;
  name: string;
  tour: string;
  tourLabel?: string;
  status: 'live' | 'upcoming' | 'complete';
  startDate: string;
  endDate: string;
  courseName?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  espnEventId: string;
  className?: string;
}

const TOUR_LABELS: Record<string, string> = {
  'pga': 'PGA Tour',
  'lpga': 'LPGA Tour',
  'eur': 'DP World Tour',
  'champions-tour': 'Champions Tour',
};

export function EventCard({
  name,
  tour,
  tourLabel,
  status,
  startDate,
  endDate,
  courseName,
  location,
  espnEventId,
  className,
}: EventCardProps) {
  const displayTour = tourLabel || TOUR_LABELS[tour] || tour;
  const dateRange = formatTournamentDateRange(startDate, endDate) ?? '';
  
  return (
    <Link
      to={`/tourhub/event/${tour}/${espnEventId}`}
      className={cn(
        "block bg-surface-card border border-border-subtle rounded-sq-lg p-4 hover:bg-surface-alt transition-all group",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-meta text-text-tertiary uppercase tracking-wide font-medium">
              {displayTour}
            </span>
            <StatusChip status={status} />
          </div>
          
          <h3 className="text-body-lg font-semibold text-text-primary truncate mb-1">
            {name}
          </h3>
          
          <p className="text-body-sm text-text-secondary mb-1">
            {dateRange}
          </p>
          
          {(courseName || location) && (
            <p className="text-body-sm text-text-tertiary truncate">
              {[courseName, location].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
        
        <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
