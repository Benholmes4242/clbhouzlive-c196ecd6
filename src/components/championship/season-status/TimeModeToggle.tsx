import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: 'season' | 'allTime';
  onChange: (value: 'season' | 'allTime') => void;
  seasonYear?: number;
}

export const TimeModeToggle: React.FC<Props> = ({ value, onChange, seasonYear }) => {
  const yearLabel = String(seasonYear ?? new Date().getFullYear());

  return (
    <div className="flex justify-center py-1">
      <div className="inline-flex items-center rounded-[14px] p-[3px]" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
        <button
          onClick={() => onChange('season')}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-xl transition-all',
            value === 'season'
              ? 'bg-card text-foreground font-semibold'
              : 'text-muted-foreground'
          )}
        >
          {yearLabel}
        </button>
        <button
          onClick={() => onChange('allTime')}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-xl transition-all',
            value === 'allTime'
              ? 'bg-card text-foreground font-semibold'
              : 'text-muted-foreground'
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};
