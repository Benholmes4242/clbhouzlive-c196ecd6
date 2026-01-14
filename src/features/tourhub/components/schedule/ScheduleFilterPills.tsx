/**
 * ScheduleFilterPills - Polished filter tabs with pill background active state
 * 
 * Features:
 * - Prominent pill background for active state
 * - Pulsing dot indicator for Live tab when events are active
 * - 44px min height for adequate tap targets
 * - Smooth animations when switching tabs
 * - Sufficient contrast for inactive tabs with hover/press states
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type ScheduleFilterType = 'all' | 'upcoming' | 'live' | 'completed';

interface FilterOption {
  value: ScheduleFilterType;
  label: string;
  hasLiveIndicator?: boolean;
}

interface ScheduleFilterPillsProps {
  activeFilter: ScheduleFilterType;
  onFilterChange: (filter: ScheduleFilterType) => void;
  counts: {
    all: number;
    live: number;
    upcoming: number;
    completed: number;
  };
}

export function ScheduleFilterPills({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: ScheduleFilterPillsProps) {
  const options: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live', hasLiveIndicator: true },
    { value: 'completed', label: 'Completed' },
  ];

  const showLiveDot = counts.live > 0;

  return (
    <div 
      className="py-2"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Grid layout for even spacing */}
      <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                // Base styles - 44px min height for tap targets
                "relative min-h-[44px] px-3 py-2.5 rounded-full text-sm font-semibold",
                "inline-flex items-center justify-center gap-1.5",
                "transition-all duration-200 ease-out",
                // Active state - pill background
                isActive 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 active:scale-[0.98]"
              )}
            >
              {/* Animated content wrapper */}
              <motion.span
                initial={false}
                animate={{ 
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center gap-1.5"
              >
                <span>{option.label}</span>
                
                {/* Live indicator dot - pulsing when live events exist */}
                {option.hasLiveIndicator && showLiveDot && (
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    isActive 
                      ? "bg-emerald-400 animate-[pulse_1.5s_ease-in-out_infinite]" 
                      : "bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite]"
                  )} />
                )}
              </motion.span>
            </button>
          );
        })}
      </div>
    </div>
  );
}