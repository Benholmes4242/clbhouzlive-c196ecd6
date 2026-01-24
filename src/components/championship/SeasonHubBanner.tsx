import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Trophy, Sun, Leaf } from 'lucide-react';

interface Season {
  id: string;
  name: string;
  tagline: string;
  color: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  daysRemaining: number | null;
}

interface SeasonHubBannerProps {
  seasons: Season[];
  currentSeason: Season;
  onSeasonSelect?: (seasonId: string) => void;
}

const getSeasonIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('pre-season') || nameLower.includes('training')) return Dumbbell;
  if (nameLower.includes('major')) return Trophy;
  if (nameLower.includes('summer')) return Sun;
  return Leaf;
};

/**
 * SeasonHubBanner - Combined season hero and timeline selector
 * 
 * Features:
 * - Current season hero with icon and progress
 * - Integrated timeline strip for season navigation
 * - No separate SeasonStageSelector needed
 */
export const SeasonHubBanner: React.FC<SeasonHubBannerProps> = ({
  seasons,
  currentSeason,
  onSeasonSelect,
}) => {
  const Icon = getSeasonIcon(currentSeason.name);
  
  // Calculate progress
  const startDate = new Date(currentSeason.startDate);
  const endDate = new Date(currentSeason.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = currentSeason.daysRemaining ?? 0;
  const progressPercent = daysRemaining > 0 
    ? ((totalDays - daysRemaining) / totalDays) * 100 
    : 100;

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Current Season Hero */}
      <div 
        className="p-4"
        style={{ backgroundColor: `${currentSeason.color}15` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${currentSeason.color}25` }}
            >
              <Icon className="w-6 h-6" style={{ color: currentSeason.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{currentSeason.name}</h2>
              <p className="text-sm text-muted-foreground">{currentSeason.tagline}</p>
            </div>
          </div>
          
          {/* Days Remaining */}
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: currentSeason.color }}>
              {daysRemaining}
            </div>
            <div className="text-xs text-muted-foreground">days left</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: currentSeason.color 
            }}
          />
        </div>
      </div>

      {/* Season Timeline Strip */}
      <div className="flex bg-muted/30">
        {seasons.slice(0, 4).map((season) => {
          const SeasonIcon = getSeasonIcon(season.name);
          const isActive = season.isCurrent;
          
          return (
            <button
              key={season.id}
              onClick={() => onSeasonSelect?.(season.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                isActive && "bg-white shadow-sm"
              )}
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isActive ? "bg-opacity-100" : "bg-opacity-30"
                )}
                style={{ backgroundColor: isActive ? `${season.color}20` : 'transparent' }}
              >
                <SeasonIcon 
                  className="w-4 h-4" 
                  style={{ color: isActive ? season.color : '#9CA3AF' }}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {season.name.split(' ')[0]}
              </span>
              {isActive && season.daysRemaining && (
                <span 
                  className="text-[9px] font-bold"
                  style={{ color: season.color }}
                >
                  {season.daysRemaining}d
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonHubBanner;
