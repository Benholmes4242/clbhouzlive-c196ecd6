import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: 'season' | 'allTime';
  onChange: (value: 'season' | 'allTime') => void;
  seasonYear?: number;
}

export const TimeModeToggle: React.FC<Props> = ({ value, onChange, seasonYear }) => {
  const yearLabel = String(seasonYear ?? new Date().getFullYear());

  const tabs = [
    { key: 'season' as const, label: yearLabel },
    { key: 'allTime' as const, label: 'All-Time' },
  ];

  return (
    <div className="flex justify-center py-1">
      <div className="inline-flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'min-h-[36px] px-4 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]',
              value === tab.key
                ? 'bg-foreground text-white'
                : 'bg-transparent text-muted-foreground border-[1.5px] border-border'
            )}
            style={{ borderRadius: 8 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
