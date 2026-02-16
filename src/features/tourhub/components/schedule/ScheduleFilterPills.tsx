/**
 * ScheduleFilterPills - Filter tabs matching Tour Overview Performance Rankings style
 * Active: dark bg, white text | Inactive: transparent, muted text
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const options: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live', hasLiveIndicator: true },
    { value: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = options.findIndex(o => o.value === activeFilter);
    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex] as HTMLButtonElement;
    
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeFilter]);

  return (
    <div 
      className="py-1"
      role="tablist"
      aria-label="Filter tournaments"
    >
      <div 
        ref={containerRef}
        className="relative flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Animated indicator */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-xl bg-foreground"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {options.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative flex-shrink-0 flex-1 z-10 py-2.5 px-5 text-sm transition-colors duration-200 whitespace-nowrap",
                "min-h-[44px] rounded-xl active:scale-[0.95] transition-transform",
                isActive 
                  ? "text-background font-semibold" 
                  : "text-muted-foreground font-medium hover:text-foreground/70"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {option.label}
                
                {option.hasLiveIndicator && counts.live > 0 && (
                  <>
                    <span className="text-[11px]">({counts.live})</span>
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75",
                        isActive ? "animate-ping" : ""
                      )} style={{ background: '#22C55E' }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22C55E' }} />
                    </span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
