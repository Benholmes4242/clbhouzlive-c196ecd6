import React from 'react';
import { cn } from '@/lib/utils';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
  seasonYear?: number;
}

/**
 * TimeModeToggle — Premium pill toggle for Season / All-Time.
 * Dynamically derives the year label from the active season.
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
  seasonYear,
}) => {
  const yearLabel = String(seasonYear ?? new Date().getFullYear());

  const options = [
    { id: 'seasonal' as const, label: yearLabel },
    { id: 'all_time' as const, label: 'All-Time' },
  ];

  return (
    <div className="w-full px-1">
      <div
        className="flex rounded-xl p-1"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
      >
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex-1 py-2.5 rounded-[10px] text-[15px] font-medium',
                'transition-all duration-200 ease-in-out active:scale-[0.97]',
                isActive
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeModeToggle;
