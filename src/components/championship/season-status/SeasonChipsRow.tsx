import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonChip, type SeasonType, type SeasonState } from './SeasonChip';

interface SeasonChipsRowProps {
  currentSeason: SeasonType;
  onSeasonClick?: (season: SeasonType) => void;
  className?: string;
}

const ALL_SEASONS: SeasonType[] = ['preseason', 'major', 'summer', 'off'];

/**
 * SeasonChipsRow - Horizontal row of season chips
 * 
 * Rules:
 * - Display all 4 season chips
 * - Past seasons show as completed
 * - Current season shows as active
 * - Future seasons show as locked
 * - Next season gets "Next" badge
 */
export const SeasonChipsRow: React.FC<SeasonChipsRowProps> = ({
  currentSeason,
  onSeasonClick,
  className,
}) => {
  const getSeasonState = (season: SeasonType): SeasonState => {
    const currentIndex = ALL_SEASONS.indexOf(currentSeason);
    const seasonIndex = ALL_SEASONS.indexOf(season);
    
    if (season === currentSeason) return 'active';
    if (seasonIndex < currentIndex) return 'completed'; // Past seasons are completed
    return 'locked'; // Future seasons are locked
  };

  const getIsNext = (season: SeasonType): boolean => {
    const currentIndex = ALL_SEASONS.indexOf(currentSeason);
    const seasonIndex = ALL_SEASONS.indexOf(season);
    return seasonIndex === currentIndex + 1; // Next season after current
  };
  
  return (
    <div
      className={cn(
        'flex items-stretch justify-center gap-1.5 px-2',
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
