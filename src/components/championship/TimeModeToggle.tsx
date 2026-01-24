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
      <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => onChange('seasonal')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            value === 'seasonal'
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          This Season
        </button>
        <button
          onClick={() => onChange('all_time')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            value === 'all_time'
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All-Time
        </button>
      </div>
    </div>
  );
};

export default TimeModeToggle;
