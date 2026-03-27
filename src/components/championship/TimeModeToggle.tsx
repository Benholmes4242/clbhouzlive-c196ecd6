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
      <div
        className="flex gap-1"
        style={{
          backgroundColor: '#F1F5F9',
          borderRadius: 12,
          padding: 3,
        }}
      >
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className="flex-1 flex items-center justify-center transition-all duration-200 active:scale-[0.97]"
              style={{
                height: 38,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'hsl(var(--card))' : 'transparent',
                color: isActive ? '#0F172A' : '#64748B',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
