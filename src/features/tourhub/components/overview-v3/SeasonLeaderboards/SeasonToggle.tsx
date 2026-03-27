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
            className="flex-shrink-0 active:scale-95 transition-transform"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: isSelected ? 600 : 500,
              borderRadius: '10px',
              background: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
              border: isSelected
                ? '1px solid hsl(var(--foreground))'
                : '1px solid hsl(var(--border))',
              color: isSelected ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
              boxShadow: isSelected
                ? '0 2px 8px hsl(var(--foreground) / 0.15)'
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
