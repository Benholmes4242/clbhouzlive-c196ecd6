import React, { useState, useCallback } from 'react';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';
import { AchievementBadgeSquircle, type SquircleTier } from '@/components/achievements/AchievementBadgeSquircle';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

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
 * Now uses Embla snap carousel (C1) with:
 * - Horizontal swipe on mobile
 * - Snap-to-card alignment
 * - Slight "peek" of next card
 * - Dot indicators
 * - Milestone states: unlocked (subtle glow), next (strong glow), locked (readable)
 */
export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  const progressPct = getAchievementsProgressPct(totalPlayed);
  const targetColor = getCurrentTargetColor(totalPlayed);
  
  // Find next milestone index for current target state
  const nextIndex = MILESTONES.findIndex(m => totalPlayed < m.threshold);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, onSelect]);

  // Calculate rail positioning
  const containerHalfWidth = 36;

  return (
    <section className="space-y-2 mt-6">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-2 px-2.5">
        Achievements
      </h3>
      <p className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground/70 mb-3 px-2.5">
        Milestone achievements (all lists)
      </p>

      {/* Snap carousel (C1) */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 px-2.5">
          {MILESTONES.map((milestone, index) => {
            const isUnlocked = totalPlayed >= milestone.threshold;
            const isNext = !isUnlocked && index === nextIndex;
            const remaining = Math.max(0, milestone.threshold - totalPlayed);

            return (
              <CarouselItem 
                key={milestone.tierId} 
                className="pl-2 basis-auto"
              >
                <div className="flex flex-col items-center min-w-[80px] gap-1">
                  {/* Milestone squircle with states (C2) */}
                  <AchievementBadgeSquircle
                    tier={String(milestone.threshold) as SquircleTier}
                    unlocked={isUnlocked}
                    isCurrentTarget={isNext}
                    onClick={onMilestoneClick ? () => onMilestoneClick(milestone) : undefined}
                  />

                  {/* Labels - locked tiles have better clarity (item 5) */}
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-[11px] font-medium whitespace-nowrap",
                      isUnlocked ? "text-foreground" : isNext ? "text-foreground" : "text-muted-foreground/80"
                    )}>
                      {milestone.tierName}
                    </p>
                    <p className={cn(
                      "text-[10px] leading-[1.2] py-0.5",
                      isUnlocked ? "text-emerald-500" : "text-foreground/60"
                    )}>
                      {isUnlocked ? 'Unlocked' : `${remaining} away`}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Progress line (C3) - bumped height 1-2px (item 5) */}
      <div className="mx-2.5 mt-4">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPct}%`, 
              backgroundColor: targetColor,
              boxShadow: `0 0 8px ${targetColor}50`,
            }}
          />
        </div>
      </div>

      {/* Dot indicators (optional) */}
      {count > 4 && (
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: Math.min(count, 8) }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1 rounded-full transition-all',
                idx === current
                  ? 'w-3 bg-foreground/50'
                  : 'w-1 bg-foreground/15'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}