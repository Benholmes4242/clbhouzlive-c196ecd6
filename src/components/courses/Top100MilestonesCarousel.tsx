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

const MAX_TOP100 = 400;

interface Top100MilestonesCarouselProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: Top100ClubMeta) => void;
}

export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  // Calculate overall progress percentage (0-400)
  const clamped = Math.min(MAX_TOP100, Math.max(0, totalPlayed));
  const overallPct = (clamped / MAX_TOP100) * 100;

  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold text-foreground">Achievements</h3>

      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
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
              {/* Ring */}
              <div className="relative">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center bg-white"
                  style={{
                    boxShadow: isUnlocked
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
              </div>

              {/* Labels - always two lines */}
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-foreground whitespace-nowrap">
                  {milestone.tierName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isUnlocked ? 'Unlocked' : `${remaining} away`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overall progress bar (0-400) */}
      <div className="mt-4 px-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D9C7A3] via-[#2E5930] to-[#0C0F14]"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
