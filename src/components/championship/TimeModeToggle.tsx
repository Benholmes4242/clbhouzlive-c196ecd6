import React from 'react';
import { cn } from '@/lib/utils';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
}

/**
 * TimeModeToggle - This Season / All-Time toggle
 * 
 * Features:
 * - Centered, compact placement
 * - Subtle background pill container
 * - Active state with shadow
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center p-0.5 bg-[#e2e8f0]/50 rounded-full border border-[#e2e8f0]/80">
        <button
          onClick={() => onChange('seasonal')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all",
            value === 'seasonal'
              ? "bg-white shadow-sm text-[#1e293b]"
              : "text-[#64748b] hover:text-[#475569]"
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('all_time')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all",
            value === 'all_time'
              ? "bg-white shadow-sm text-[#1e293b]"
              : "text-[#64748b] hover:text-[#475569]"
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};

export default TimeModeToggle;
