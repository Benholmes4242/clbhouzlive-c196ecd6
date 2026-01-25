import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonChip } from './SeasonChip';
import { getChipStatus, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';

interface SeasonChipsRowProps {
  currentSeasonId: SeasonId;
  seasonData: Record<SeasonId, { daysUntilAvailable?: number }>;
  onSeasonClick?: (seasonId: SeasonId) => void;
  className?: string;
}

/**
 * SeasonChipsRow - Horizontal row of season chips
 * 
 * Rules:
 * - Display only 3 chips (excludes active season since it's in hero card)
 * - Horizontal scroll if overflow
 * - 8px gap between chips
 * 
 * Specs:
 * - Placement: Below ActiveSeasonCard, outside the card
 */
export const SeasonChipsRow: React.FC<SeasonChipsRowProps> = ({
  currentSeasonId,
  seasonData,
  onSeasonClick,
  className,
}) => {
  // Filter out the current season
  const otherSeasons = SEASON_ORDER.filter(id => id !== currentSeasonId);
  
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {otherSeasons.map((seasonId) => {
        const status = getChipStatus(seasonId, currentSeasonId);
        const data = seasonData[seasonId] || {};
        
        return (
          <SeasonChip
            key={seasonId}
            seasonId={seasonId}
            status={status}
            daysUntilAvailable={data.daysUntilAvailable}
            onClick={() => onSeasonClick?.(seasonId)}
          />
        );
      })}
    </div>
  );
};

export default SeasonChipsRow;
