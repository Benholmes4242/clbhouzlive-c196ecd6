/**
 * TournamentDetailTabs - Premium segmented tab control
 * 
 * Features:
 * - Text-only labels (no icons)
 * - Spring-animated sliding indicator
 * - LIVE pulsing dot on Leaderboard tab
 * - Summary tab hidden for non-completed tournaments
 * - Tap feedback
 * - Horizontal scroll on narrow screens
 */

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TournamentTab = 'overview' | 'leaderboard' | 'summary' | 'tee-times' | 'hole-stats';

interface TabConfig {
  value: TournamentTab;
  label: string;
}

const ALL_TABS: TabConfig[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'summary', label: 'Summary' },
  { value: 'tee-times', label: 'Tee Times' },
  { value: 'hole-stats', label: 'Holes' },
];

interface TournamentDetailTabsProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  className?: string;
  /** Tournament status — used for contextual badges */
  tournamentStatus?: string;
}

export function TournamentDetailTabs({ activeTab, onTabChange, className, tournamentStatus }: TournamentDetailTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const isLive = tournamentStatus === 'inprogress';
  const isCompleted = tournamentStatus === 'closed';

  // Filter tabs: hide Summary for non-completed tournaments
  const visibleTabs = ALL_TABS.filter(tab => {
    if (tab.value === 'summary' && !isCompleted) return false;
    return true;
  });

  // Calculate indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = visibleTabs.findIndex(t => t.value === activeTab);
    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex] as HTMLButtonElement;
    
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab, visibleTabs.length]);

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div 
        ref={containerRef}
        className="relative flex items-stretch rounded-xl overflow-x-auto scrollbar-hide p-1 bg-muted/60 scroll-snap-x"
      >
        {/* Animated sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-card shadow-sm border border-border/60"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {/* Tab buttons */}
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                "min-h-[44px] rounded-lg shrink-0 active:scale-[0.95] transition-transform scroll-snap-start",
                isActive 
                  ? "text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              
              {/* LIVE pulsing dot on Leaderboard tab */}
              {isLive && tab.value === 'leaderboard' && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}