/**
 * SeasonToggle - Year Selection Component
 * 
 * Features:
 * - Matches category pill styling (amber active, subtle border inactive)
 * - Consistent design language
 */

import { memo } from 'react';
import { CATEGORY_ACCENT_COLORS } from './constants';
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

  const accent = CATEGORY_ACCENT_COLORS['sg_total'];

  return (
    <div className="flex items-center" style={{ gap: '6px' }}>
      {availableSeasons.map((season) => {
        const isSelected = season.year === selectedYear;

        return (
          <button
            key={season.id}
            onClick={() => onYearChange(season.year)}
            className="flex-shrink-0 active:scale-95 transition-transform"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: isSelected ? 600 : 500,
              borderRadius: '10px',
              background: isSelected ? accent.primary : '#FFFFFF',
              border: isSelected
                ? `1px solid ${accent.primary}`
                : '1px solid rgba(0, 0, 0, 0.08)',
              color: isSelected ? '#FFFFFF' : 'rgba(0, 0, 0, 0.45)',
              boxShadow: isSelected
                ? `0 2px 8px ${accent.shadow}`
                : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
            }}
          >
            {season.year}
          </button>
        );
      })}
    </div>
  );
});
