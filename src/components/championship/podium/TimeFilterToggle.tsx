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
    <div className={cn('flex p-1 bg-[#e2e8f0] rounded-xl', className)}>
      <button
        onClick={() => onChange('season')}
        className={cn(
          'flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all duration-150',
          value === 'season'
            ? 'bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]'
            : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
        )}
      >
        This Season
      </button>
      <button
        onClick={() => onChange('all_time')}
        className={cn(
          'flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all duration-150',
          value === 'all_time'
            ? 'bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]'
            : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
        )}
      >
        All-Time
      </button>
    </div>
  );
};
