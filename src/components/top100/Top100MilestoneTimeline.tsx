import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';
import { AchievementBadgeSquircle, type SquircleTier } from '@/components/achievements/AchievementBadgeSquircle';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';

interface Top100MilestoneTimelineProps {
  totalTop100Played: number;
}

/**
 * Get the current target tier's accent color
 */
function getCurrentTargetColor(totalPlayed: number): string {
  const thresholds = TOP100_MILESTONES.map(m => m.threshold);
  for (let i = 0; i < thresholds.length; i++) {
    if (totalPlayed < thresholds[i]) {
      const tier = thresholds[i];
      if (MILESTONE_PALETTE_MAP[tier]) {
        return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[tier]];
      }
      break;
    }
  }
  // If all unlocked, use the last tier's color
  const lastTier = thresholds[thresholds.length - 1];
  if (MILESTONE_PALETTE_MAP[lastTier]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[lastTier]];
  }
  return '#94a3b8';
}

/**
 * Maps totalPlayed → percentage across milestones (evenly spaced)
 */
function getProgressPct(totalPlayed: number, thresholds: number[]): number {
  if (totalPlayed <= 0) return 0;
  const maxThreshold = thresholds[thresholds.length - 1];
  if (totalPlayed >= maxThreshold) return 100;

  const lastIndex = thresholds.length - 1;
  const segmentSize = 100 / lastIndex;

  let i = 0;
  for (let idx = 0; idx < lastIndex; idx++) {
    if (totalPlayed <= thresholds[idx + 1]) {
      i = idx;
      break;
    }
  }

  const startThreshold = i === 0 ? 0 : thresholds[i];
  const endThreshold = thresholds[i + 1];

  const base = (i / lastIndex) * 100;
  const ratio = (totalPlayed - startThreshold) / (endThreshold - startThreshold);
  const pct = base + ratio * segmentSize;

  return Math.max(0, Math.min(100, pct));
}

/**
 * Top100MilestoneTimeline - Part of Global Achievement & Milestone System
 * 
 * Uses unified AchievementBadgeSquircle for consistent styling site-wide
 * Progress rail runs BEHIND the milestone squircles (contained within bounds)
 */
export function Top100MilestoneTimeline({ totalTop100Played }: Top100MilestoneTimelineProps) {
  const milestones = TOP100_MILESTONES;
  const thresholds = milestones.map(m => m.threshold);
  const nextIndex = milestones.findIndex(m => totalTop100Played < m.threshold);
  const maxThreshold = milestones[milestones.length - 1]?.threshold || 400;
  const progressPct = getProgressPct(totalTop100Played, thresholds);
  const targetColor = getCurrentTargetColor(totalTop100Played);

  // Calculate rail positioning - contained within first/last squircle centers
  // Squircle width is 56px (h-14 w-14), container min-width is 80px
  // So center of first = 40px, center of last = totalWidth - 40px
  const squircleHalfWidth = 28; // half of 56px squircle
  const containerHalfWidth = 40; // half of 80px container

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        <span className="text-xs text-muted-foreground">
          {totalTop100Played} / {maxThreshold} Top 100 courses
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="-mx-4 px-4 pb-2 scrollbar-hide overflow-x-auto">
        {/* Container for rail + squircles */}
        <div className="relative inline-flex">
          {/* Progress rail - positioned behind squircles, contained within bounds */}
          {/* Start/end aligned to center of first/last squircle */}
          <div 
            className="absolute h-[3px] rounded-full pointer-events-none"
            style={{
              // Vertically center: squircle is 56px, so center at 28px
              top: '28px',
              transform: 'translateY(-50%)',
              // Horizontal containment: center of first to center of last
              left: `${containerHalfWidth}px`,
              right: `${containerHalfWidth}px`,
              background: 'var(--journey-rail-base, rgba(31, 36, 40, 0.08))',
            }}
          >
            {/* Fill portion - soft gradient with tier color */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${targetColor}40, ${targetColor}60)`,
              }}
            />
          </div>

          {/* Row of squircle badges - sits above rail (z-10) */}
          <div className="flex gap-3 relative z-10">
            {milestones.map((m, index) => {
              const unlocked = totalTop100Played >= m.threshold;
              const isNext = !unlocked && index === nextIndex;

              return (
                <div
                  key={m.id}
                  className="flex min-w-[80px] flex-col items-center gap-1"
                >
                  {/* Unified AchievementBadgeSquircle with current target state */}
                  <AchievementBadgeSquircle
                    tier={String(m.threshold) as SquircleTier}
                    unlocked={unlocked}
                    isCurrentTarget={isNext}
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
        </div>
      </div>
    </section>
  );
}
