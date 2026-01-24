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
 * - Centered placement
 * - Subtle background pill container
 * - Active state with shadow
 * - Consistent with design system
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center p-1 bg-[#e2e8f0] rounded-xl">
        <button
          onClick={() => onChange('seasonal')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-all",
            value === 'seasonal'
              ? "bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]"
              : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('all_time')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-all",
            value === 'all_time'
              ? "bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]"
              : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};

export default TimeModeToggle;
