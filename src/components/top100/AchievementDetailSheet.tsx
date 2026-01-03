import React from 'react';
import { Trophy, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOP100_MILESTONES, type Top100Milestone } from '@/config/top100Milestones';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AchievementDetailSheetProps {
  milestone: Top100Milestone | null;
  totalTop100Played: number;
  isOpen: boolean;
  onClose: () => void;
  onViewCourses?: () => void;
  onViewAllMilestones?: () => void;
}

function getTierAccentColor(threshold: number): string {
  if (MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return '#94a3b8';
}

/**
 * Achievement Detail Sheet (C5)
 * 
 * Bottom sheet on mobile showing:
 * - Milestone name and description
 * - Requirement
 * - Current progress
 * - CTAs to view courses or all milestones
 */
export function AchievementDetailSheet({
  milestone,
  totalTop100Played,
  isOpen,
  onClose,
  onViewCourses,
  onViewAllMilestones,
}: AchievementDetailSheetProps) {
  if (!milestone) return null;

  const accentColor = getTierAccentColor(milestone.threshold);
  const progress = totalTop100Played;
  const target = milestone.threshold;
  const remaining = Math.max(0, target - progress);
  const isUnlocked = progress >= target;
  const progressPercent = Math.min(100, (progress / target) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2">
              {/* Trophy icon */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ 
                  backgroundColor: `${accentColor}15`,
                  border: `2px solid ${accentColor}30`,
                }}
              >
                <Trophy className="w-7 h-7" style={{ color: accentColor }} />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-foreground mb-1">
                {milestone.label}
              </h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center mb-6">
                Awarded for playing {milestone.threshold} Top 100 courses worldwide
              </p>

              {/* Progress card */}
              <div 
                className="rounded-sq-md border p-4 mb-4"
                style={{ borderColor: `${accentColor}30` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span 
                    className={cn(
                      "text-sm font-bold",
                      isUnlocked ? "text-emerald-500" : ""
                    )}
                    style={{ color: isUnlocked ? undefined : accentColor }}
                  >
                    {progress} / {target}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progressPercent}%`, 
                      backgroundColor: isUnlocked ? '#10b981' : accentColor,
                    }}
                  />
                </div>

                {/* Status */}
                <p className="text-xs text-muted-foreground text-center">
                  {isUnlocked 
                    ? '🎉 Achievement unlocked!' 
                    : `${remaining} more course${remaining === 1 ? '' : 's'} to go`
                  }
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                {!isUnlocked && onViewCourses && (
                  <Button
                    onClick={() => {
                      onViewCourses();
                      onClose();
                    }}
                    className="w-full rounded-full"
                    style={{ backgroundColor: accentColor }}
                  >
                    View unplayed courses
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}

                {onViewAllMilestones && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onViewAllMilestones();
                      onClose();
                    }}
                    className="w-full rounded-full"
                  >
                    View all milestones
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}