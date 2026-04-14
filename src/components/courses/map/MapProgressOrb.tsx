/**
 * MapProgressOrb - Floating progress orb for Top 100 Map
 * Shows % complete, expands to show milestone info
 * FIX 4: Uses dynamic season color instead of hardcoded #3EBD93
 */

import React, { useState, useEffect, useCallback } from 'react';
import '@/styles/hero-glass.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import type { Top100MapScope } from '@/hooks/useTop100MapCourses';

interface MapProgressOrbProps {
  playedCount: number;
  totalCount: number;
  scope: Top100MapScope;
  /** Dynamic season accent color */
  seasonColor?: string;
  onMilestoneClick?: () => void;
}

export const MapProgressOrb: React.FC<MapProgressOrbProps> = ({
  playedCount,
  totalCount,
  scope,
  seasonColor = '#F7931E',
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
          className="glass-card relative flex items-center justify-center w-12 h-12 rounded-full active:scale-95 active:bg-white/15 transition-all duration-150"
        >
          {/* Progress ring - dynamic season color */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2.5"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={seasonColor}
              strokeWidth="2.5"
              strokeDasharray={`${(percentage / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Centered percentage text */}
          <span className="relative z-10 text-xs font-bold text-white/90">{percentage}%</span>
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={handlePanelInteraction}
          className="glass-card relative rounded-2xl p-3.5 min-w-[180px]"
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
              clearAutoCollapseTimer();
            }}
            className="absolute top-1.5 right-1.5 p-2.5 text-white/50 active:scale-[0.9] active:text-white/80 transition-transform rounded-full"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Current progress */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
              <Trophy className="h-4 w-4" style={{ color: '#F7931E' }} />
            </div>
            <div>
              <p className="text-[10px] text-white/50">Current</p>
              <p className="text-xs font-semibold text-white">
                {clubInfo?.tierName || 'Getting Started'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-2.5" />

          {/* Next milestone */}
          <div className="mb-2.5">
            <p className="text-[10px] text-white/50 mb-0.5">
              Next milestone
            </p>
            <p className="text-sm font-bold text-white">
              {getNextClubName(nextMilestone)}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
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
                'px-2.5 py-1.5 rounded-lg',
                'bg-white/90 text-foreground text-[10px] font-medium',
                'active:opacity-90 active:scale-[0.98]',
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
