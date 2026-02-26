import React, { useState, useCallback } from 'react';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

// Badge image mapping by threshold
const BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

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
 * Uses actual badge images instead of squircle shapes:
 * - 70-80px badge images from src/assets/badges/
 * - Horizontal swipe carousel
 * - Earned: Full color, Locked: 40% opacity + 60% grayscale
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

  return (
    <section className="space-y-2 mt-6">
      {/* Section header - consistent styling */}
      <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-2 px-4">
        Achievements
      </h3>
      <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-muted-foreground/60 mb-3 px-4">
        Milestone achievements (all lists)
      </p>

      {/* Snap carousel with badge images */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 px-4">
          {MILESTONES.map((milestone, index) => {
            const isUnlocked = totalPlayed >= milestone.threshold;
            const isNext = !isUnlocked && index === nextIndex;
            const remaining = Math.max(0, milestone.threshold - totalPlayed);
            const badgeImage = BADGE_IMAGES[milestone.threshold];

            return (
              <CarouselItem 
                key={milestone.tierId} 
                className="pl-2 basis-auto"
              >
                <button
                  onClick={onMilestoneClick ? () => onMilestoneClick(milestone) : undefined}
                  className="flex flex-col items-center min-w-[80px] gap-1 focus:outline-none active:scale-[0.95] transition-transform"
                >
                  {/* Badge image (70-80px) with visual states */}
                  <div className="relative">
                    <img
                      src={badgeImage}
                      alt={milestone.tierName}
                      className={cn(
                        "w-[85px] h-[100px] object-contain transition-all",
                        !isUnlocked && "opacity-40 grayscale-[60%]"
                      )}
                      style={isUnlocked ? {
                        filter: 'drop-shadow(0 4px 20px rgba(212, 168, 83, 0.3))',
                      } : undefined}
                    />
                  </div>

                  {/* Labels - club name + status */}
                  <div className="mt-1 text-center" title={milestone.tierName}>
                    <p className={cn(
                      "text-[11px] font-medium line-clamp-2 leading-tight",
                      isUnlocked ? "text-foreground" : isNext ? "text-foreground" : "text-muted-foreground/60"
                    )}>
                      {milestone.tierName}
                    </p>
                    <p className={cn(
                      "text-[10px] leading-[1.2] py-0.5 font-medium",
                      isUnlocked ? "text-emerald-500" : "text-muted-foreground/70"
                    )}>
                      {isUnlocked ? 'Unlocked' : `${remaining} away`}
                    </p>
                  </div>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Progress line - 8px height with shimmer */}
      <div className="mx-4 mt-4">
        <div 
          className="h-2 rounded-full bg-muted/80 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Overall milestone progress: ${totalPlayed} courses played`}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ 
              width: `${progressPct}%`, 
              background: `linear-gradient(90deg, ${targetColor} 0%, ${targetColor}CC 100%)`,
              boxShadow: `0 0 10px ${targetColor}40, 0 0 4px ${targetColor}30`,
            }}
          >
            {/* Shimmer animation */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>

      {/* Dot indicators - only show when scrollable */}
      {count > 4 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: Math.min(count, 8) }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                idx === current
                  ? 'w-4 bg-foreground/50'
                  : 'w-1.5 bg-foreground/15'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}