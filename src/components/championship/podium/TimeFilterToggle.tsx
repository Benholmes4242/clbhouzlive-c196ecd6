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
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}>
      <button
        onClick={() => onChange('season')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          value === 'season'
            ? 'bg-background shadow text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        This Season
      </button>
      <button
        onClick={() => onChange('all_time')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          value === 'all_time'
            ? 'bg-background shadow text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        All-Time
      </button>
    </div>
  );
};
