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
    <div className="flex items-center" style={{ gap: '16px' }}>
      {availableSeasons.map((season) => {
        const isSelected = season.year === selectedYear;

        return (
          <button
            key={season.id}
            onClick={() => onYearChange(season.year)}
            
            className="flex-shrink-0 active:scale-[0.97] transition-all px-0 text-sm font-semibold"
            style={{
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderBottom: isSelected ? '2px solid #F7931E' : '2px solid transparent',
              borderRadius: 0,
              color: isSelected ? '#0F172A' : '#94A3B8',
              paddingBottom: '6px',
            }}
          >
            {season.year}
          </button>
        );
      })}
    </div>
  );
});
