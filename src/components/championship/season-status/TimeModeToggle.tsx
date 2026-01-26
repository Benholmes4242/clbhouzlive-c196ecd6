import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: 'season' | 'allTime';
  onChange: (value: 'season' | 'allTime') => void;
}

export const TimeModeToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex justify-center py-1">
      <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
        <button
          onClick={() => onChange('season')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150',
            value === 'season'
              ? 'bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]'
              : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('allTime')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150',
            value === 'allTime'
              ? 'bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]'
              : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};
