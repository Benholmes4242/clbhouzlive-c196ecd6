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
    <div className={cn('inline-flex p-0.5 bg-[#e2e8f0]/50 rounded-full border border-[#e2e8f0]/80', className)}>
      <button
        onClick={() => onChange('season')}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-full transition-all duration-150',
          value === 'season'
            ? 'bg-white shadow-sm text-[#1e293b]'
            : 'text-[#64748b] hover:text-[#475569]'
        )}
      >
        This Season
      </button>
      <button
        onClick={() => onChange('all_time')}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-full transition-all duration-150',
          value === 'all_time'
            ? 'bg-white shadow-sm text-[#1e293b]'
            : 'text-[#64748b] hover:text-[#475569]'
        )}
      >
        All-Time
      </button>
    </div>
  );
};
