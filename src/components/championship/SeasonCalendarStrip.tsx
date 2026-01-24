import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Season {
  id: string;
  name: string;
  icon?: string; // Now optional
  tagline: string;
  color: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  daysRemaining: number | null;
  daysUntilStart: number | null;
}

interface SeasonCalendarStripProps {
  seasons: Season[];
}

/**
 * SeasonCalendarStrip - Season navigation (no icons)
 */
export const SeasonCalendarStrip: React.FC<SeasonCalendarStripProps> = ({
  seasons,
}) => {
  return (
    <TooltipProvider>
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-[#e2e8f0] rounded-xl">
          {seasons.map((season) => {
            return (
              <Tooltip key={season.id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 text-xs font-medium rounded-lg transition-all",
                      season.isCurrent 
                        ? "m-1 bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]" 
                        : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
                    )}
                  >
                    <span className="whitespace-nowrap">
                      {season.name.split(' ')[0]}
                    </span>
                    {season.isCurrent && season.daysRemaining && (
                      <span 
                        className="ml-1 text-[10px] font-bold"
                        style={{ color: season.color }}
                      >
                        {season.daysRemaining}d
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[180px]">
                  <div className="space-y-1">
                    <p className="font-semibold">{season.name}</p>
                    <p className="text-xs italic text-muted-foreground">{season.tagline}</p>
                    <p className="text-xs">
                      {new Date(season.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(season.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </p>
                    {season.daysUntilStart && (
                      <p className="text-xs font-medium" style={{ color: season.color }}>
                        Starts in {season.daysUntilStart} days
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};
