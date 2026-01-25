import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonChip, type SeasonType, type SeasonState } from './SeasonChip';

interface SeasonChipsRowProps {
  currentSeason: SeasonType;
  onSeasonClick?: (season: SeasonType) => void;
  className?: string;
}

const ALL_SEASONS: SeasonType[] = ['major', 'summer', 'off'];

/**
 * SeasonChipsRow - Horizontal row of season chips
 * 
 * Rules:
 * - Display all 3 season chips
 * - Wrap on smaller screens
 * - 8px gap between chips
 */
export const SeasonChipsRow: React.FC<SeasonChipsRowProps> = ({
  currentSeason,
  onSeasonClick,
  className,
}) => {
  // Determine state and "next" for each season
  const getSeasonState = (season: SeasonType): SeasonState => {
    if (season === currentSeason) return 'active';
    // Simple logic: seasons after current are upcoming, before are locked
    const currentIndex = ALL_SEASONS.indexOf(currentSeason);
    const seasonIndex = ALL_SEASONS.indexOf(season);
    return seasonIndex > currentIndex ? 'upcoming' : 'locked';
  };

  const getIsNext = (season: SeasonType): boolean => {
    const currentIndex = ALL_SEASONS.indexOf(currentSeason);
    const seasonIndex = ALL_SEASONS.indexOf(season);
    return seasonIndex === currentIndex + 1;
  };
  
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 flex-wrap px-2',
        className
      )}
    >
      {ALL_SEASONS.map((season) => (
        <SeasonChip
          key={season}
          season={season}
          state={getSeasonState(season)}
          isNext={getIsNext(season)}
          onClick={() => onSeasonClick?.(season)}
        />
      ))}
    </div>
  );
};

export default SeasonChipsRow;
