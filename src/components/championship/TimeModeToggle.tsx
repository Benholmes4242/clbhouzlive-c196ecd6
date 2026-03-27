import React from 'react';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
  seasonYear?: number;
}

/**
 * TimeModeToggle — Full-width segmented control for Season / All-Time.
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
    <div className="w-full">
      <div className="flex gap-2 w-full">
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`flex-1 min-h-[36px] px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] ${
                isActive
                  ? 'text-white bg-foreground border-0'
                  : 'text-muted-foreground bg-transparent border-[1.5px] border-border'
              }`}
              style={{ borderRadius: 8 }}
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
