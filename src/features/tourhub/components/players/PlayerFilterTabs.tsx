/**
 * PlayerFilterTabs - Text-on-background tabs with white active indicator
 * Matches ScheduleFilterPills pattern exactly.
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

export type PlayerTierType = 'field' | 'elite' | 'active' | 'rising';

interface FilterOption {
  value: PlayerTierType;
  label: string;
}

interface PlayerFilterTabsProps {
  activeFilter: PlayerTierType;
  onFilterChange: (filter: PlayerTierType) => void;
  counts: { field: number; elite: number; active: number; rising: number };
}

const OPTIONS: FilterOption[] = [
  { value: 'field', label: 'The Field' },
  { value: 'elite', label: 'Elite' },
  { value: 'active', label: 'On Tour' },
  { value: 'rising', label: 'Rising' },
];

export function PlayerFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: PlayerFilterTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = OPTIONS.findIndex(o => o.value === activeFilter);
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
      aria-label="Filter players"
    >
      <div
        ref={containerRef}
        className="relative flex items-stretch"
      >
        {/* Animated white rounded indicator behind active tab */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-xl bg-card shadow-sm border border-border/40"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {OPTIONS.map((option) => {
          const isActive = activeFilter === option.value;
          const count = counts[option.value];
          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "relative flex-1 z-10 py-2.5 text-[13px] font-semibold transition-colors duration-200 whitespace-nowrap",
                "min-h-[44px] rounded-xl active:scale-[0.95] transition-transform",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <span className="flex items-center justify-center gap-1">
                {option.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold tabular-nums",
                    isActive ? "text-foreground/50" : "text-muted-foreground/50"
                  )}>
                    ({count})
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
