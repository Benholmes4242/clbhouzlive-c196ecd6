import React from 'react';
import { cn } from '@/lib/utils';
import { TimeFilter } from '@/types/podium';

interface TimeFilterToggleProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  seasonYear?: number;
  className?: string;
}

export const TimeFilterToggle: React.FC<TimeFilterToggleProps> = ({
  value,
  onChange,
  seasonYear,
  className,
}) => {
  const yearLabel = String(seasonYear ?? new Date().getFullYear());

  const tabs = [
    { key: 'season' as const, label: yearLabel },
    { key: 'all_time' as const, label: 'All-Time' },
  ];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
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
  );
};
