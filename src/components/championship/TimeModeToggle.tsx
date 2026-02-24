import React from 'react';
import { cn } from '@/lib/utils';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
}

const options = [
  { id: 'seasonal' as const, label: 'This Season' },
  { id: 'all_time' as const, label: 'All-Time' },
];

/**
 * TimeModeToggle — Pill-background treatment matching season selector.
 * Equal-width options, smooth transition, subtle shadow on active.
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex justify-center">
      <div
        className="inline-flex rounded-xl p-[3px]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
      >
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex-1 min-w-[110px] px-6 py-2 rounded-[10px] text-sm font-medium',
                'transition-all duration-200 ease-in-out active:scale-[0.97]',
                isActive
                  ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
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
