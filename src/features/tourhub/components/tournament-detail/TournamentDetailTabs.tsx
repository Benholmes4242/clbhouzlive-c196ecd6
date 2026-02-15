/**
 * TournamentDetailTabs - Plain text tabs with underline active state
 * TD-05: Added role="tablist" and role="tab" with aria-selected
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
  tournamentStatus?: string;
}

export function TournamentDetailTabs({ activeTab, onTabChange, className, tournamentStatus }: TournamentDetailTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const isLive = tournamentStatus === 'inprogress';
  const isCompleted = tournamentStatus === 'closed';

  const visibleTabs = ALL_TABS.filter(tab => {
    if (tab.value === 'summary' && !isCompleted) return false;
    return true;
  });

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
    <div className={cn("relative border-b border-border", className)}>
      <div 
        ref={containerRef}
        className="relative flex items-stretch"
        role="tablist"
        aria-label="Tournament Sections"
      >
        {/* Animated underline indicator */}
        <motion.div
          className="absolute bottom-0 h-[2px] rounded-full bg-foreground"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 py-3 text-sm whitespace-nowrap",
                "min-h-[44px] transition-colors duration-200 active:scale-[0.95] transition-transform",
                isActive 
                  ? "text-foreground font-semibold" 
                  : "text-muted-foreground font-medium hover:text-foreground"
              )}
            >
              {tab.label}
              
              {/* LIVE pulsing dot on Leaderboard tab */}
              {isLive && tab.value === 'leaderboard' && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#f59e0b' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#f59e0b' }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
