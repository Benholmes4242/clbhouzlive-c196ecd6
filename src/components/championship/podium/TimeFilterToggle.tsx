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
      <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-full max-w-xs">
        <button
          onClick={() => onChange('season')}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
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
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
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
