import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingJourneyButtonProps {
  playedCount: number;
  totalCount: number;
  nextMilestone: string;
  toNextMilestone: number;
  closestFriend?: {
    name: string;
    played: number;
  };
}

/**
 * Floating progress button that expands to show journey summary.
 * Signature feature for Top 100 list pages.
 */
export const FloatingJourneyButton: React.FC<FloatingJourneyButtonProps> = ({
  playedCount,
  totalCount,
  nextMilestone,
  toNextMilestone,
  closestFriend,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoMinimizeTimer, setAutoMinimizeTimer] = useState<NodeJS.Timeout | null>(null);

  const percent = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;

  // Auto-minimize after 3 seconds of inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
      setAutoMinimizeTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleToggle = () => {
    if (autoMinimizeTimer) {
      clearTimeout(autoMinimizeTimer);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-64 bg-slate-900/95 backdrop-blur-lg rounded-sq-lg shadow-xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-xs font-medium text-white/60">Your Journey</span>
              <button
                onClick={handleToggle}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg font-bold text-white">{playedCount}/{totalCount}</span>
                  <span className="text-xs text-white/50">{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Next milestone */}
              <div className="flex items-center gap-2 text-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white/80">
                  <span className="font-medium text-white">{toNextMilestone}</span> to {nextMilestone}
                </span>
              </div>

              {/* Closest friend comparison */}
              {closestFriend && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white/80">
                    <span className="font-medium text-white">{closestFriend.name}</span> has {closestFriend.played}
                  </span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => navigate('/top100?tab=my-progress')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-900 text-xs font-semibold rounded-sq-sm hover:bg-white/90 transition-colors"
              >
                <span>View full journey</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleToggle}
            className="w-14 h-14 rounded-full bg-slate-900/95 backdrop-blur-lg shadow-xl border border-white/10 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <span className="text-sm font-bold text-white">{percent}%</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
