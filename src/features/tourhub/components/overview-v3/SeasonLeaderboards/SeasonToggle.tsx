/**
 * SeasonToggle - Year Selection Component
 * 
 * Features:
 * - Matches category pill styling
 * - Consistent design language with semantic tokens
 */

import { memo } from 'react';
import type { AvailableSeason } from '@/features/tourhub/hooks/useSeasonLeaderboards';

interface SeasonToggleProps {
  availableSeasons: AvailableSeason[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const SeasonToggle = memo(function SeasonToggle({
  availableSeasons,
  selectedYear,
  onYearChange,
}: SeasonToggleProps) {
  if (availableSeasons.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center" style={{ gap: '6px' }}>
      {availableSeasons.map((season) => {
        const isSelected = season.year === selectedYear;

        return (
          <button
            key={season.id}
            onClick={() => onYearChange(season.year)}
            
            className={`flex-shrink-0 active:scale-[0.97] transition-all min-h-[36px] px-4 text-xs sm:text-sm font-semibold ${
              isSelected
                ? 'text-white shadow-none border-0'
                : 'bg-transparent text-muted-foreground border-[1.5px] border-border'
            }`}
            style={{
              borderRadius: 8,
              cursor: 'pointer',
              background: isSelected ? '#0F172A' : 'transparent',
            }}
          >
            {season.year}
          </button>
        );
      })}
    </div>
  );
});
