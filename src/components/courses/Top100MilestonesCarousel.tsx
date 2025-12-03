import React from 'react';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Tier colors
const TIER_COLORS: Record<string, string> = {
  none: '#94a3b8',
  rookie: '#D9C7A3',
  fairway: '#8BBF5A',
  founders: '#2E5930',
  heritage: '#C8A44B',
  century: '#B7BCC6',
  elite: '#D9A441',
  legendary: '#5A3E8C',
  grandslam: '#0C0F14',
};

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
    <section className="space-y-2">
      <h3 className="text-base font-semibold text-foreground">Achievements</h3>

      {/* Outer scroller */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        {/* Inner column that scrolls together */}
        <div className="inline-flex flex-col gap-3 min-w-full">
          {/* Row of circles */}
          <div className="flex gap-4">
            {MILESTONES.map((milestone) => {
              const isUnlocked = totalPlayed >= milestone.threshold;
              const remaining = Math.max(0, milestone.threshold - totalPlayed);
              const tierColor = TIER_COLORS[milestone.tierId] || TIER_COLORS.none;

              return (
                <button
                  key={milestone.tierId}
                  type="button"
                  onClick={() => onMilestoneClick?.(milestone)}
                  className="flex flex-col items-center min-w-[72px] gap-1 focus:outline-none"
                >
                  {/* Squircle ring */}
                  <div className="relative">
                    <div
                      className="h-14 w-14 rounded-[18px] flex items-center justify-center bg-white"
                      style={{
                        boxShadow: isUnlocked
                          ? `0 0 18px ${tierColor}22`
                          : '0 0 10px rgba(15,23,42,0.06)',
                        border: `2px solid ${isUnlocked ? tierColor : `${tierColor}66`}`,
                        opacity: isUnlocked ? 1 : 0.45,
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: tierColor }}>
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

          {/* Progress bar - inside the scroller, moves with circles */}
          <div className="h-1 rounded-full bg-muted/80 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D9C7A3] via-[#2E5930] to-[#0C0F14]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}