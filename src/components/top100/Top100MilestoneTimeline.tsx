import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';
import { AchievementBadgeSquircle, type SquircleTier } from '@/components/achievements/AchievementBadgeSquircle';

interface Top100MilestoneTimelineProps {
  totalTop100Played: number;
}

/**
 * Top100MilestoneTimeline - Part of Global Achievement & Milestone System
 * 
 * Uses unified AchievementBadgeSquircle for consistent styling site-wide
 */
export function Top100MilestoneTimeline({ totalTop100Played }: Top100MilestoneTimelineProps) {
  const milestones = TOP100_MILESTONES;
  const nextIndex = milestones.findIndex(m => totalTop100Played < m.threshold);
  const maxThreshold = milestones[milestones.length - 1]?.threshold || 400;

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        <span className="text-xs text-muted-foreground">
          {totalTop100Played} / {maxThreshold} Top 100 courses
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {milestones.map((m, index) => {
          const unlocked = totalTop100Played >= m.threshold;
          const isNext = !unlocked && index === nextIndex;

          return (
            <div
              key={m.id}
              className="flex min-w-[80px] flex-col items-center gap-1"
            >
              {/* Unified AchievementBadgeSquircle */}
              <AchievementBadgeSquircle
                tier={String(m.threshold) as SquircleTier}
                unlocked={unlocked}
              />

              {/* Label */}
              <span className="mt-1 text-[11px] font-medium text-foreground text-center">
                {m.label}
              </span>

              {/* Status caption */}
              <span className="text-[10px] text-muted-foreground">
                {unlocked
                  ? 'Unlocked'
                  : isNext
                  ? `${m.threshold - totalTop100Played} away`
                  : `${m.threshold} courses`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar under row */}
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{
            width: `${Math.min((totalTop100Played / maxThreshold) * 100, 100)}%`,
          }}
        />
      </div>
    </section>
  );
}
