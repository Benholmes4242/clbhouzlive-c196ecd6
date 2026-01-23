import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Clock } from 'lucide-react';
import type { ChampionshipSeason } from '@/types/championship';

interface ChampionshipHeaderProps {
  season: ChampionshipSeason | null;
  className?: string;
}

/**
 * ChampionshipHeader - Shows season name and countdown timer.
 */
export function ChampionshipHeader({ season, className }: ChampionshipHeaderProps) {
  if (!season) {
    return (
      <div className={cn('px-4 py-3', className)}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const daysLabel = season.days_remaining === 1 ? 'day' : 'days';

  return (
    <div className={cn('px-4 py-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{season.name}</h2>
            <p className="text-sm text-muted-foreground">Championship Mode</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{season.days_remaining}</span>
          <span>{daysLabel} left</span>
        </div>
      </div>
    </div>
  );
}
