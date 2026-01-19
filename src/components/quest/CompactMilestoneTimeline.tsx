/**
 * CompactMilestoneTimeline - Dense vertical stepper for milestones
 * Replaces tall cards with list rows - 40% row height reduction
 * Expands on tap (future), maintains all unlock logic
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { MILESTONE_TAGLINES } from '@/config/achievementTaglines';

interface MilestoneItem {
  id: string;
  threshold: number;
  name: string;
  tierName: string;
  tagline: string;
  isUnlocked: boolean;
}

interface CompactMilestoneTimelineProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean }) => void;
}

export const CompactMilestoneTimeline: React.FC<CompactMilestoneTimelineProps> = ({
  totalPlayed,
  onMilestoneClick,
}) => {
  // Build milestones from config
  const milestones: MilestoneItem[] = useMemo(() => {
    return MILESTONE_TIER_META.map(meta => ({
      id: `milestone_${meta.threshold}`,
      threshold: meta.threshold,
      name: meta.tierName,
      tierName: `${meta.threshold} Club`,
      tagline: MILESTONE_TAGLINES[meta.threshold] || '',
      isUnlocked: totalPlayed >= meta.threshold,
    }));
  }, [totalPlayed]);

  const currentIndex = milestones.findIndex(m => !m.isUnlocked);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div 
        className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-slate-200"
        style={{ zIndex: 0 }}
      />

      <div className="space-y-0">
        {milestones.map((milestone, index) => {
          const tierColor = getRingColorForThreshold(milestone.threshold);
          const isCurrent = index === currentIndex;
          const isLast = index === milestones.length - 1;
          
          return (
            <motion.button
              key={milestone.id}
              className={cn(
                "relative flex items-center gap-3 w-full text-left py-2 px-1 rounded-lg transition-all",
                "hover:bg-slate-50/80 active:bg-slate-100/60"
              )}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onMilestoneClick?.(milestone)}
            >
              {/* Node indicator */}
              <div 
                className={cn(
                  "relative z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  milestone.isUnlocked && "ring-1 ring-offset-1 ring-offset-white",
                  isCurrent && !milestone.isUnlocked && "ring-1 ring-offset-1 ring-offset-white"
                )}
                style={{
                  background: milestone.isUnlocked
                    ? tierColor
                    : isCurrent
                      ? 'var(--quest-accent-green)'
                      : '#f1f5f9',
                  border: milestone.isUnlocked
                    ? `1.5px solid ${tierColor}`
                    : isCurrent
                      ? '1.5px solid var(--quest-accent-green)'
                      : '1.5px solid #e2e8f0',
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color': milestone.isUnlocked ? tierColor : isCurrent ? 'var(--quest-accent-green)' : undefined,
                }}
              >
                {milestone.isUnlocked ? (
                  <Check className="w-3 h-3 text-white" />
                ) : isCurrent ? (
                  <Trophy className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}

                {/* Pulse for current */}
                {isCurrent && !milestone.isUnlocked && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--quest-accent-green)' }}
                    animate={{ 
                      opacity: [0.15, 0.3, 0.15],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span 
                    className={cn(
                      "text-sm font-semibold truncate",
                      milestone.isUnlocked ? "text-slate-800" : isCurrent ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {milestone.name}
                  </span>
                  {milestone.isUnlocked && (
                    <span 
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ 
                        background: `${tierColor}12`,
                        color: tierColor,
                      }}
                    >
                      ✓ Earned
                    </span>
                  )}
                </div>
                {!milestone.isUnlocked && isCurrent && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {milestone.threshold - totalPlayed} to go
                  </p>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight 
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  milestone.isUnlocked || isCurrent ? "text-slate-400" : "text-slate-300"
                )} 
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CompactMilestoneTimeline;
