import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Flame } from 'lucide-react';
import { RankMovementIndicator, ZoneIndicator } from '../primitives';
import type { UserChampionshipStatus } from '@/types/championship';

interface DivisionStatusCardProps {
  status: UserChampionshipStatus;
  className?: string;
}

/**
 * DivisionStatusCard - Shows current user's division status with progress.
 */
export function DivisionStatusCard({ status, className }: DivisionStatusCardProps) {
  return (
    <div
      className={cn(
        'mx-4 p-4 rounded-2xl border bg-card',
        className
      )}
      style={{ borderColor: `${status.division_color}40` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: status.division_color }}
          />
          <span className="font-semibold text-foreground">{status.division_name}</span>
        </div>
        <RankMovementIndicator 
          movement={status.rank_movement_daily} 
          period="daily"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-foreground">#{status.current_rank}</div>
          <div className="text-xs text-muted-foreground">Rank</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{status.courses_this_season}</div>
          <div className="text-xs text-muted-foreground">Courses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 text-orange-500" />
            {status.streak_current}
          </div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>

      {/* Progress to next division */}
      {status.courses_to_next_division && status.courses_to_next_division > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Next division in</span>
            </div>
            <span className="font-medium text-foreground">
              {status.courses_to_next_division} courses
            </span>
          </div>
        </div>
      )}

      {/* Zone indicator */}
      {status.zone && (
        <div className="mt-3">
          <ZoneIndicator zone={status.zone} size="sm" />
        </div>
      )}
    </div>
  );
}
