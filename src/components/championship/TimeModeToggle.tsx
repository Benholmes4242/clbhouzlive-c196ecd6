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
      <div className="flex gap-2 justify-center">
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'px-5 py-1.5 text-[14px] font-medium transition-all duration-200 active:scale-[0.97]',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-muted-foreground'
              )}
              style={{
                borderRadius: 20,
                backgroundColor: isActive ? '#475569' : 'transparent',
              }}
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
