/**
 * EditorialTabs - Premium glass bar tabs with sliding underline
 * 
 * Tabs:
 * - The Field (All Players)
 * - Elite (Top Ranked)
 * - On Tour (Most Active)
 * - Next Wave (Rookies)
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';

interface EditorialTabsProps {
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
  counts?: {
    all: number;
    topRanked: number;
    mostActive: number;
    rookies: number;
  };
}

const TABS: { value: PlayerFilterType; label: string; countKey: keyof NonNullable<EditorialTabsProps['counts']> }[] = [
  { value: 'all', label: 'The Field', countKey: 'all' },
  { value: 'top-ranked', label: 'Elite', countKey: 'topRanked' },
  { value: 'most-active', label: 'On Tour', countKey: 'mostActive' },
  { value: 'rookies', label: 'Next Wave', countKey: 'rookies' },
];

export function EditorialTabs({ activeFilter, onFilterChange, counts }: EditorialTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position when active tab changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const activeButton = containerRef.current.querySelector(`[data-tab="${activeFilter}"]`) as HTMLElement;
    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeFilter]);

  return (
    <div 
      className={cn(
        "relative",
        "bg-background/60 backdrop-blur-md",
        "border border-border/40",
        "rounded-xl",
        "p-1"
      )}
    >
      {/* Glass bar container */}
      <div
        ref={containerRef}
        className="relative flex"
        role="tablist"
        aria-label="Filter players"
      >
        {/* Sliding indicator */}
        <motion.div
          className={cn(
            "absolute bottom-0 h-[2px] rounded-full",
            "bg-[hsl(var(--tab-orange))]",
            "shadow-[0_0_8px_hsl(var(--tab-orange)/0.4)]"
          )}
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          const count = counts?.[tab.countKey];

          return (
            <button
              key={tab.value}
              data-tab={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                "relative flex-1 px-3 py-2.5",
                "text-sm font-medium",
                "transition-colors duration-200",
                "rounded-lg",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "text-[10px] font-normal tabular-nums",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                  )}>
                    {count > 999 ? '999+' : count}
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
