/**
 * MapProgressOrb - Floating progress orb for Top 100 Map
 * Shows % complete, expands to show milestone info
 * Now a standalone component (not positioned absolutely)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import type { Top100MapScope } from '@/hooks/useTop100MapCourses';

interface MapProgressOrbProps {
  playedCount: number;
  totalCount: number;
  scope: Top100MapScope;
  onMilestoneClick?: () => void;
}

export const MapProgressOrb: React.FC<MapProgressOrbProps> = ({
  playedCount,
  totalCount,
  scope,
  onMilestoneClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCollapseTimerRef = React.useRef<number | null>(null);

  const percentage = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;

  // Get current and next club info
  const clubInfo = getTop100Club(playedCount);
  const nextMilestones = [5, 10, 20, 50, 100, 200, 300, 400];
  const nextMilestone = nextMilestones.find((m) => m > playedCount) || 400;
  const coursesRemaining = nextMilestone - playedCount;

  const getNextClubName = (threshold: number): string => {
    const names: Record<number, string> = {
      5: '5 Club',
      10: '10 Club',
      20: '20 Club',
      50: '50 Club',
      100: '100 Club',
      200: '200 Club',
      300: '300 Club',
      400: '400 Club',
    };
    return names[threshold] || `${threshold} Club`;
  };

  const clearAutoCollapseTimer = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  }, []);

  const scheduleAutoCollapse = useCallback(() => {
    clearAutoCollapseTimer();
    autoCollapseTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
  }, [clearAutoCollapseTimer]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      clearAutoCollapseTimer();
    } else {
      setIsExpanded(true);
      scheduleAutoCollapse();
    }
  }, [isExpanded, clearAutoCollapseTimer, scheduleAutoCollapse]);

  // Clear timer on unmount
  useEffect(() => {
    return () => clearAutoCollapseTimer();
  }, [clearAutoCollapseTimer]);

  // Reset auto-collapse when interacting
  const handlePanelInteraction = useCallback(() => {
    if (isExpanded) {
      scheduleAutoCollapse();
    }
  }, [isExpanded, scheduleAutoCollapse]);

  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        <motion.button
          key="orb"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={handleToggle}
          className={cn(
            'relative flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-slate-50 text-slate-700 border border-slate-200/50',
            'shadow-[0_4px_16px_rgba(0,0,0,0.1)]',
            'hover:bg-slate-100 active:scale-95',
            'transition-all duration-150'
          )}
        >
          {/* Progress ring - orange accent on slate-50 background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="2.5"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#F7931E"
              strokeWidth="2.5"
              strokeDasharray={`${(percentage / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Percentage */}
          <span className="text-xs font-bold relative z-10">{percentage}%</span>
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={handlePanelInteraction}
          className={cn(
            'relative',
            'bg-white dark:bg-slate-900',
            'rounded-sq-md',
            'shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
            'border border-slate-200/80 dark:border-slate-700/50',
            'p-3.5 min-w-[180px]'
          )}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
              clearAutoCollapseTimer();
            }}
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Current progress */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800">
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Current</p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {clubInfo?.tierName || 'Getting Started'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2.5" />

          {/* Next milestone */}
          <div className="mb-2.5">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
              Next milestone
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {getNextClubName(nextMilestone)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {coursesRemaining} course{coursesRemaining !== 1 ? 's' : ''} remaining
            </p>
          </div>

          {/* CTA */}
          {onMilestoneClick && (
            <button
              onClick={() => {
                onMilestoneClick();
                setIsExpanded(false);
              }}
              className={cn(
                'w-full flex items-center justify-center gap-1',
                'px-2.5 py-1.5 rounded-sq-sm',
                'bg-slate-900 text-white text-[10px] font-medium',
                'hover:bg-slate-800 active:scale-[0.98]',
                'transition-all duration-150'
              )}
            >
              Plan next milestone
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapProgressOrb;
