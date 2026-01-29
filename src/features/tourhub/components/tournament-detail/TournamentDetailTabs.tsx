/**
 * TournamentDetailTabs - Premium segmented tab control
 * 
 * Features:
 * - Animated sliding indicator
 * - Icon + label tabs
 * - Mobile-friendly scrollable
 */

import { useRef, useState, useEffect } from 'react';
import { BarChart3, Trophy, FileText, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TournamentTab = 'overview' | 'leaderboard' | 'summary' | 'tee-times' | 'hole-stats';

interface Tab {
  value: TournamentTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { value: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
  { value: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
  { value: 'tee-times', label: 'Tee Times', icon: <Clock className="w-4 h-4" /> },
  { value: 'hole-stats', label: 'Hole Stats', icon: <Target className="w-4 h-4" /> },
];

interface TournamentDetailTabsProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  className?: string;
}

export function TournamentDetailTabs({ activeTab, onTabChange, className }: TournamentDetailTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Calculate indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = tabs.findIndex(t => t.value === activeTab);
    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex] as HTMLButtonElement;
    
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div 
        ref={containerRef}
        className="relative flex items-stretch rounded-xl overflow-x-auto scrollbar-hide p-1"
        style={{ 
          background: 'rgba(226, 232, 240, 0.6)',
        }}
      >
        {/* Animated sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
          style={{ 
            border: '1px solid rgba(0,0,0,0.04)',
          }}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {/* Tab buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative z-10 flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors duration-200 whitespace-nowrap",
                "min-h-[44px] rounded-lg shrink-0",
                isActive 
                  ? "text-slate-900" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
