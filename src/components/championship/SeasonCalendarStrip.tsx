import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Trophy, Sun, Leaf, LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Season {
  id: string;
  name: string;
  icon?: string; // Now optional, will use SVG icons
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

// Map season names to icons
const getSeasonIcon = (name: string): LucideIcon => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('pre-season') || nameLower.includes('training')) {
    return Dumbbell;
  }
  if (nameLower.includes('major') || nameLower.includes('championship')) {
    return Trophy;
  }
  if (nameLower.includes('summer') || nameLower.includes('open')) {
    return Sun;
  }
  return Leaf; // Default for off-season, fall, winter
};

/**
 * SeasonCalendarStrip - Season navigation with SVG icons (no emojis)
 */
export const SeasonCalendarStrip: React.FC<SeasonCalendarStripProps> = ({
  seasons,
}) => {
  return (
    <TooltipProvider>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {seasons.map((season) => {
          const Icon = getSeasonIcon(season.name);
          
          return (
            <Tooltip key={season.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center p-2 rounded-xl border-2 transition-all min-w-[70px]",
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
                  <Icon 
                    className={cn(
                      "w-5 h-5",
                      season.isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                    style={season.isCurrent ? { color: season.color } : undefined}
                  />
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
                  <p className="font-semibold flex items-center gap-1">
                    <Icon className="w-4 h-4" /> {season.name}
                  </p>
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
    </TooltipProvider>
  );
};
