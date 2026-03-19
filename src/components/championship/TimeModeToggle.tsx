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
      <div className="flex gap-4 justify-center" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className="relative px-4 py-2 transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
              style={{
                fontSize: 16,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: isActive ? '-0.025em' : '0',
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                background: 'transparent',
                border: 'none',
                minHeight: 44,
              }}
            >
              {option.label}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeModeToggle;
