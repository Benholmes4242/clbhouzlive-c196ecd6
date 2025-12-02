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

interface Top100MilestonesCarouselProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: Top100ClubMeta) => void;
}

export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  const nextIndex = MILESTONES.findIndex(m => totalPlayed < m.threshold);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Milestones</h3>

      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {MILESTONES.map((milestone, index) => {
          const isUnlocked = totalPlayed >= milestone.threshold;
          const remaining = Math.max(0, milestone.threshold - totalPlayed);
          const isNext = !isUnlocked && nextIndex === index;
          const tierColor = TIER_COLORS[milestone.tierId] || TIER_COLORS.none;

          return (
            <button
              key={milestone.tierId}
              type="button"
              onClick={() => onMilestoneClick?.(milestone)}
              className="flex flex-col items-center min-w-[72px] gap-1 focus:outline-none"
            >
              {/* Ring */}
              <div className="relative">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center bg-white"
                  style={{
                    boxShadow: isUnlocked || isNext
                      ? `0 0 18px ${tierColor}22`
                      : '0 0 10px rgba(15,23,42,0.06)',
                    border: isUnlocked
                      ? `3px solid ${tierColor}`
                      : `2px solid ${tierColor}66`,
                    opacity: isUnlocked ? 1 : 0.45,
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: tierColor }}>
                    {milestone.threshold}
                  </span>
                </div>

                {isNext && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900 text-[9px] font-medium text-white whitespace-nowrap">
                    Next
                  </span>
                )}
              </div>

              {/* Labels */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-foreground">
                  {milestone.tierName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isUnlocked
                    ? 'Unlocked'
                    : `${remaining} away`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
