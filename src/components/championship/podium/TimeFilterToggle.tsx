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
      <div className="inline-flex items-center p-1 bg-[#e2e8f0] rounded-sq-pill">
        <button
          onClick={() => onChange('season')}
          className={cn(
            'px-6 py-2 rounded-sq-pill text-sm font-medium transition-colors',
            value === 'season'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('all_time')}
          className={cn(
            'px-6 py-2 rounded-sq-pill text-sm font-medium transition-colors',
            value === 'all_time'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};
