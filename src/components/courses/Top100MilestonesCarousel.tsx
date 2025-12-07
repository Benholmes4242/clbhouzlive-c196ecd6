import React from 'react';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';
import { MILESTONE_THEMES, type MilestoneTier } from '@/lib/globalAchievementMilestoneSystem';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Get ring color from global system (bgDark for softer pastel)
function getTierRingColor(threshold: number): string {
  const theme = MILESTONE_THEMES[threshold as MilestoneTier];
  return theme?.bgDark ?? '#94a3b8';
}

// Get accent color from global system (for text/icons)
function getTierAccentColor(threshold: number): string {
  const theme = MILESTONE_THEMES[threshold as MilestoneTier];
  return theme?.accent ?? '#94a3b8';
}

// Thresholds for each milestone
const THRESHOLDS = [5, 10, 20, 50, 100, 200, 300, 400];

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

export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  const progressPct = getAchievementsProgressPct(totalPlayed);

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
        <div className="inline-flex flex-col gap-3 min-w-full">
          {/* Row of circles */}
          <div className="flex gap-4">
            {MILESTONES.map((milestone) => {
              const isUnlocked = totalPlayed >= milestone.threshold;
              const remaining = Math.max(0, milestone.threshold - totalPlayed);
              const ringColor = getTierRingColor(milestone.threshold);
              const accentColor = getTierAccentColor(milestone.threshold);

              return (
                <button
                  key={milestone.tierId}
                  type="button"
                  onClick={() => onMilestoneClick?.(milestone)}
                  className="flex flex-col items-center min-w-[72px] gap-1 focus:outline-none"
                >
                  {/* Squircle ring - uses bgDark for softer pastel matching cards */}
                  <div className="relative">
                    <div
                      className="h-14 w-14 rounded-[18px] flex items-center justify-center bg-white"
                      style={{
                        boxShadow: isUnlocked
                          ? `0 0 18px ${ringColor}22`
                          : '0 0 10px rgba(15,23,42,0.06)',
                        border: `2px solid ${isUnlocked ? ringColor : `${ringColor}66`}`,
                        opacity: isUnlocked ? 1 : 0.45,
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: accentColor }}>
                        {milestone.threshold}
                      </span>
                    </div>
                  </div>

                  {/* Labels - consistent two lines */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-foreground whitespace-nowrap">
                      {milestone.tierName}
                    </p>
                    <p className="text-[11px] leading-[1.2] text-muted-foreground">
                      {isUnlocked ? 'Unlocked' : `${remaining} away`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress bar - uses bgDark colors from global system */}
          <div className="h-1 rounded-full bg-muted/80 relative">
            <div
              className="h-full rounded-full"
              style={{ 
                width: `${progressPct}%`,
                background: `linear-gradient(to right, ${MILESTONE_THEMES[5].bgDark}, ${MILESTONE_THEMES[20].bgDark}, ${MILESTONE_THEMES[400].bgDark})`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}