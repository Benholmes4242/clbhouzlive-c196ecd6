/**
 * MapProgressOrb - Floating progress orb for Top 100 Map
 * Shows % complete, expands to show milestone info
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
    <div className="pointer-events-auto absolute right-4 bottom-28 z-20">
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
              'w-14 h-14 rounded-full',
              'bg-slate-900 text-white',
              'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
              'hover:bg-slate-800 active:scale-95',
              'transition-all duration-150'
            )}
          >
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#F7931E"
                strokeWidth="3"
                strokeDasharray={`${(percentage / 100) * 150.8} 150.8`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Percentage */}
            <span className="text-sm font-bold relative z-10">{percentage}%</span>
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
              'bg-white/95 dark:bg-slate-900/95',
              'backdrop-blur-xl',
              'rounded-sq-lg',
              'shadow-[0_8px_32px_rgba(0,0,0,0.2)]',
              'border border-white/30 dark:border-slate-700/50',
              'p-4 min-w-[200px]'
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
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Current progress */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {clubInfo?.tierName || 'Getting Started'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" />

            {/* Next milestone */}
            <div className="mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Next milestone
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {getNextClubName(nextMilestone)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                  'w-full flex items-center justify-center gap-1.5',
                  'px-3 py-2 rounded-sq-sm',
                  'bg-slate-900 text-white text-xs font-medium',
                  'hover:bg-slate-800 active:scale-[0.98]',
                  'transition-all duration-150'
                )}
              >
                Plan next milestone
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapProgressOrb;
