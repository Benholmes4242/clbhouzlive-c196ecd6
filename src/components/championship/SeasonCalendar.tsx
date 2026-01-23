import React from 'react';
import { useSeasonCalendar, Season } from '@/hooks/championship/useSeasonCalendar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface SeasonCardProps {
  season: Season;
}

const SeasonCard: React.FC<SeasonCardProps> = ({ season }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatMonthRange = (start: string, end: string) => {
    const startMonth = new Date(start).toLocaleDateString('en-GB', { month: 'short' });
    const endMonth = new Date(end).toLocaleDateString('en-GB', { month: 'short' });
    return `${startMonth} - ${endMonth}`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'flex-1 p-3 rounded-lg border-2 transition-all text-left min-w-0',
            season.is_current
              ? 'shadow-lg scale-[1.02]'
              : 'opacity-60 hover:opacity-90',
            season.status === 'completed' && 'opacity-40'
          )}
          style={{
            borderColor: season.color || 'hsl(var(--border))',
            backgroundColor: season.is_current 
              ? `${season.color}15` 
              : 'transparent',
          }}
        >
          <div className="text-xl mb-1">{season.icon}</div>
          <div className="text-xs font-semibold truncate">{season.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {formatMonthRange(season.start_date, season.end_date)}
          </div>
          {season.is_current && season.days_remaining !== null && (
            <div 
              className="text-[10px] font-medium mt-1"
              style={{ color: season.color || 'hsl(var(--primary))' }}
            >
              {season.days_remaining}d left
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px]">
        <div className="space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <span>{season.icon}</span>
            <span>{season.name}</span>
          </p>
          {season.tagline && (
            <p className="text-xs italic text-muted-foreground">{season.tagline}</p>
          )}
          {season.description && (
            <p className="text-xs">{season.description}</p>
          )}
          <p className="text-xs font-medium pt-1 border-t">
            {formatDate(season.start_date)} → {formatDate(season.end_date)}
            <span className="text-muted-foreground ml-1">
              ({season.duration_days} days)
            </span>
          </p>
          {season.status === 'upcoming' && season.days_until_start !== null && (
            <p className="text-xs font-medium" style={{ color: season.color || 'hsl(var(--primary))' }}>
              Starts in {season.days_until_start} days
            </p>
          )}
          {season.status === 'completed' && (
            <p className="text-xs text-muted-foreground">Season completed</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

interface SeasonCalendarProps {
  className?: string;
}

export const SeasonCalendar: React.FC<SeasonCalendarProps> = ({ className }) => {
  const { data: seasons, isLoading } = useSeasonCalendar();

  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="text-sm font-medium text-muted-foreground mb-3">
          Championship Calendar
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) return null;

  // Get current year seasons (first 4)
  const currentYearSeasons = seasons.slice(0, 4);

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)}>
        <div className="text-sm font-medium text-muted-foreground mb-3">
          Championship Calendar
        </div>
        <div className="flex gap-2">
          {currentYearSeasons.map((season) => (
            <SeasonCard key={season.season_id} season={season} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
