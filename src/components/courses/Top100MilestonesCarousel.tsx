import React from 'react';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';
import { AchievementBadgeSquircle, type SquircleTier } from '@/components/achievements/AchievementBadgeSquircle';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Thresholds for each milestone
const THRESHOLDS = [5, 10, 20, 50, 100, 200, 300, 400];

/**
 * Get the current target tier's accent color
 */
function getCurrentTargetColor(totalPlayed: number): string {
  // Find the next unlockable tier
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (totalPlayed < THRESHOLDS[i]) {
      const tier = THRESHOLDS[i];
      if (MILESTONE_PALETTE_MAP[tier]) {
        return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[tier]];
      }
      break;
    }
  }
  // If all unlocked, use the last tier's color
  const lastTier = THRESHOLDS[THRESHOLDS.length - 1];
  if (MILESTONE_PALETTE_MAP[lastTier]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[lastTier]];
  }
  return '#94a3b8';
}

// Maps totalPlayed → percentage across all achievements (evenly spaced circles)
function getAchievementsProgressPct(totalPlayed: number): number {
  if (totalPlayed <= 0) return 0;
  if (totalPlayed >= THRESHOLDS[THRESHOLDS.length - 1]) return 100;

  const lastIndex = THRESHOLDS.length - 1;
  const segmentSize = 100 / lastIndex; // equal spacing between circles

  // Find which segment we're in
  let i = 0;
  for (let idx = 0; idx < lastIndex; idx++) {
    if (totalPlayed <= THRESHOLDS[idx + 1]) {
      i = idx;
      break;
    }
  }

  const startThreshold = i === 0 ? 0 : THRESHOLDS[i];
  const endThreshold = THRESHOLDS[i + 1];

  const base = (i / lastIndex) * 100; // start % of this segment
  const ratio = (totalPlayed - startThreshold) / (endThreshold - startThreshold);
  const pct = base + ratio * segmentSize;

  return Math.max(0, Math.min(100, pct));
}

interface Top100MilestonesCarouselProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: Top100ClubMeta) => void;
}

/**
 * Top100MilestonesCarousel - Milestone Achievements (All Lists) section
 * 
 * Features:
 * - Unified AchievementBadgeSquircle components (collector/rarity polish)
 * - Journey rail runs BEHIND squircles, contained within bounds
 * - Current target milestone emphasized with border + halo
 */
export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  const progressPct = getAchievementsProgressPct(totalPlayed);
  const targetColor = getCurrentTargetColor(totalPlayed);
  
  // Find next milestone index for current target state
  const nextIndex = MILESTONES.findIndex(m => totalPlayed < m.threshold);

  // Calculate rail positioning - contained within first/last squircle centers
  // Squircle width is 56px (h-14 w-14), container min-width is 72px
  const containerHalfWidth = 36; // half of 72px container

  return (
    <section className="space-y-2 mt-6">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-2 px-2.5">
        Achievements
      </h3>
      <p className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground/70 mb-3 px-2.5">
        Milestone achievements (all lists)
      </p>

      {/* Outer scroller */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        {/* Inner column that scrolls together */}
        <div className="inline-flex flex-col min-w-full">
          {/* Container for rail + squircles - rail runs BEHIND */}
          <div className="relative">
            {/* Progress rail - positioned behind squircles, contained within bounds */}
            {/* Start/end aligned to center of first/last squircle */}
            <div 
              className="absolute h-[3px] rounded-full pointer-events-none"
              style={{
                // Vertically center: squircle is 56px, so center at 28px
                top: '50%',
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
            <div className="flex gap-4 relative z-10">
              {MILESTONES.map((milestone, index) => {
                const isUnlocked = totalPlayed >= milestone.threshold;
                const isNext = !isUnlocked && index === nextIndex;
                const remaining = Math.max(0, milestone.threshold - totalPlayed);

                return (
                  <div
                    key={milestone.tierId}
                    className="flex flex-col items-center min-w-[72px] gap-1"
                  >
                    {/* Unified AchievementBadgeSquircle with current target state */}
                    <AchievementBadgeSquircle
                      tier={String(milestone.threshold) as SquircleTier}
                      unlocked={isUnlocked}
                      isCurrentTarget={isNext}
                      onClick={onMilestoneClick ? () => onMilestoneClick(milestone) : undefined}
                    />

                    {/* Labels - consistent two lines */}
                    <div className="mt-2 text-center">
                      <p className="text-[11px] font-medium text-foreground whitespace-nowrap">
                        {milestone.tierName}
                      </p>
                      <p className="text-[10px] leading-[1.2] text-muted-foreground py-0.5">
                        {isUnlocked ? 'Unlocked' : `${remaining} away`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
