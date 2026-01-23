import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Flame,
  Users,
  ChevronUp,
  X
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { CourseLogImpact } from '@/hooks/championship/useRecordCourseLogImpact';

interface RankImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  impact: CourseLogImpact | null;
}

/**
 * RankImpactModal - Shows the impact of logging a course on championship rankings.
 * Displays rank change, division progress, rivals passed, and streak info.
 */
export function RankImpactModal({ isOpen, onClose, impact }: RankImpactModalProps) {
  const fireConfetti = useCallback(() => {
    if (!impact) return;
    
    // Only fire confetti for positive outcomes
    if (impact.rank_change > 0 || impact.promoted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#F7931E', '#FFD700', '#10B981'],
      });
    }
  }, [impact]);

  useEffect(() => {
    if (isOpen && impact) {
      fireConfetti();
    }
  }, [isOpen, impact, fireConfetti]);

  if (!impact) return null;

  const hasRankChange = impact.rank_change !== 0;
  const rankImproved = impact.rank_change > 0;
  const rivalsPassedCount = impact.rivals_passed?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Modal */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-sm bg-background rounded-t-3xl sm:rounded-3xl',
              'shadow-xl overflow-hidden'
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header section with gradient */}
            <div 
              className={cn(
                'pt-8 pb-6 px-6 text-center',
                rankImproved 
                  ? 'bg-gradient-to-b from-emerald-500/20 to-transparent' 
                  : 'bg-gradient-to-b from-muted/50 to-transparent'
              )}
            >
              {/* Rank change badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4',
                  rankImproved && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                  !rankImproved && hasRankChange && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
                  !hasRankChange && 'bg-muted text-muted-foreground'
                )}
              >
                {rankImproved ? (
                  <TrendingUp className="w-5 h-5" />
                ) : hasRankChange ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <Minus className="w-5 h-5" />
                )}
                <span className="font-bold text-lg">
                  {rankImproved 
                    ? `+${impact.rank_change} positions` 
                    : hasRankChange 
                      ? `${impact.rank_change} positions`
                      : 'Rank maintained'
                  }
                </span>
              </motion.div>

              {/* New rank */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-sm text-muted-foreground mb-1">Your new rank</div>
                <div className="text-4xl font-bold text-foreground">
                  #{impact.rank_after}
                </div>
              </motion.div>
            </div>

            {/* Stats grid */}
            <div className="px-6 pb-6 space-y-4">
              {/* Division progress */}
              {impact.division_changed && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <ChevronUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {impact.promoted ? 'Promoted!' : 'Division Changed'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {impact.division_before} → {impact.division_after}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Courses logged */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Courses this season</span>
                </div>
                <span className="font-semibold text-foreground">
                  {impact.courses_after}
                </span>
              </motion.div>

              {/* Streak */}
              {impact.new_streak > 0 && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Current streak</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {impact.new_streak} days
                  </span>
                </motion.div>
              )}

              {/* Rivals passed */}
              {rivalsPassedCount > 0 && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Overtook {rivalsPassedCount} rival{rivalsPassedCount !== 1 ? 's' : ''}!
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Season info */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center pt-2"
              >
                <p className="text-xs text-muted-foreground">
                  {impact.season_name} · {impact.days_remaining} days remaining
                </p>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
