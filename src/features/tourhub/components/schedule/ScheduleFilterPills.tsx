/**
 * ScheduleFilterPills - Cinematic segmented control (SDS compliant)
 * 
 * Features:
 * - Unified pill-track design matching design system
 * - Animated sliding indicator
 * - Live pulse indicator
 * - 44px minimum touch targets
 * - Semantic token compliance
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

  const showLiveDot = counts.live > 0;

  // Calculate indicator position
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
      className="py-2"
      role="tablist"
      aria-label="Filter tournaments"
    >
      {/* Segmented control track */}
      <div 
        ref={containerRef}
        className="relative flex items-stretch rounded-xl overflow-hidden p-1 bg-muted/60 backdrop-blur-sm"
      >
        {/* Animated sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-card shadow-sm border border-border/20"
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
                "relative flex-1 z-10 py-2.5 text-[13px] font-semibold transition-colors duration-200 whitespace-nowrap",
                "min-h-[44px] rounded-lg active:scale-[0.95] transition-transform",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {option.label}
                
                {/* Live count + indicator */}
                {option.hasLiveIndicator && counts.live > 0 && (
                  <>
                    <span className="text-[11px]">({counts.live})</span>
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75",
                        isActive ? "animate-ping bg-red-500" : "bg-red-400"
                      )} />
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isActive ? "bg-red-500" : "bg-red-400"
                      )} />
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
