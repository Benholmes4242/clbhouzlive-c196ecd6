import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: 'season' | 'allTime';
  onChange: (value: 'season' | 'allTime') => void;
}

export const TimeModeToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex justify-center py-1">
      <div className="inline-flex items-center bg-[#e2e8f0]/50 p-0.5 rounded-full border border-[#e2e8f0]/80">
        <button
          onClick={() => onChange('season')}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-all',
            value === 'season'
              ? 'bg-white text-[#1e293b] shadow-sm'
              : 'text-[#64748b] hover:text-[#475569]'
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('allTime')}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-all',
            value === 'allTime'
              ? 'bg-white text-[#1e293b] shadow-sm'
              : 'text-[#64748b] hover:text-[#475569]'
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};
