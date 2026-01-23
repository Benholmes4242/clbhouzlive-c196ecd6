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
  icon: string;
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

export const SeasonCalendarStrip: React.FC<SeasonCalendarStripProps> = ({
  seasons,
}) => {
  return (
    <TooltipProvider>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {seasons.map((season) => (
          <Tooltip key={season.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex-shrink-0 flex flex-col items-center p-2 rounded-sq-md border-2 transition-all min-w-[70px]",
                  season.isCurrent 
                    ? "border-current shadow-lg scale-105" 
                    : "border-transparent bg-muted/30 opacity-60 hover:opacity-100"
                )}
                style={{
                  ...(season.isCurrent && {
                    borderColor: season.color,
                    boxShadow: `0 4px 20px ${season.color}30`,
                  }),
                }}
              >
                <span className="text-xl">{season.icon}</span>
                <span className="text-[10px] font-medium text-center leading-tight mt-1">
                  {season.name.split(' ')[0]}
                </span>
                {season.isCurrent && season.daysRemaining && (
                  <span 
                    className="text-[9px] font-bold mt-0.5"
                    style={{ color: season.color }}
                  >
                    {season.daysRemaining}d
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[180px]">
              <div className="space-y-1">
                <p className="font-semibold">{season.icon} {season.name}</p>
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
        ))}
      </div>
    </TooltipProvider>
  );
};
