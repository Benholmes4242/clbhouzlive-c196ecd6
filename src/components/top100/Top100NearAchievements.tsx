import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

interface Top100NearAchievementsProps {
  totalTop100Played: number;
}

export function Top100NearAchievements({ totalTop100Played }: Top100NearAchievementsProps) {
  // Show only the single closest milestone where user is within 1–20 courses
  const candidates = TOP100_MILESTONES
    .map(m => ({
      ...m,
      remaining: m.threshold - totalTop100Played,
    }))
    .filter(m => m.remaining > 0 && m.remaining <= 20)
    .sort((a, b) => a.remaining - b.remaining);

  // Only show one badge at a time - the closest one
  const closest = candidates[0];

  if (!closest) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-foreground/80">
          Badge you're close to
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {totalTop100Played} courses logged
        </span>
      </div>

      {/* Single badge display - clear distance to unlock */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <EliteGameCard
            tier={closest.threshold.toString() as EliteCardTier}
            earned={false}
            currentProgress={totalTop100Played}
            targetProgress={closest.threshold}
            title={`${closest.threshold} Club`}
            subtitle={closest.remaining === 1 ? 'Just 1 more course' : `${closest.remaining} away`}
            enableAnimations={false}
            quality="medium"
          />
        </div>
      </div>
    </section>
  );
}
