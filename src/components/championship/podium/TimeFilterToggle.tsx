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
    <div className={cn('inline-flex rounded-[14px] p-[3px]', className)} style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
      <button
        onClick={() => onChange('season')}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-xl transition-all duration-150',
          value === 'season'
            ? 'bg-card text-foreground font-semibold'
            : 'text-muted-foreground'
        )}
      >
        This Season
      </button>
      <button
        onClick={() => onChange('all_time')}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-xl transition-all duration-150',
          value === 'all_time'
            ? 'bg-card text-foreground font-semibold'
            : 'text-muted-foreground'
        )}
      >
        All-Time
      </button>
    </div>
  );
};
