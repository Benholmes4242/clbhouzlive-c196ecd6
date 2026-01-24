import React from 'react';
import { cn } from '@/lib/utils';
import { TimeFilter } from '@/types/podium';

interface TimeFilterToggleProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  className?: string;
}

export const TimeFilterToggle: React.FC<TimeFilterToggleProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex justify-center', className)}>
      <div className="inline-flex items-center p-1 bg-[#e2e8f0] rounded-xl">
        <button
          onClick={() => onChange('season')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            value === 'season'
              ? 'm-0.5 bg-white shadow-sm text-foreground border border-[#e2e8f0]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('all_time')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            value === 'all_time'
              ? 'm-0.5 bg-white shadow-sm text-foreground border border-[#e2e8f0]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};
