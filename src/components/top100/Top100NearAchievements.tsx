import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface Top100NearAchievementsProps {
  totalTop100Played: number;
}

export function Top100NearAchievements({ totalTop100Played }: Top100NearAchievementsProps) {
  // Show milestones where user is within 1–20 courses
  const candidates = TOP100_MILESTONES
    .map(m => ({
      ...m,
      remaining: m.threshold - totalTop100Played,
    }))
    .filter(m => m.remaining > 0 && m.remaining <= 20)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);

  if (candidates.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between px-2.5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          Badges you're close to
        </h2>
        <span className="text-xs text-muted-foreground">
          {totalTop100Played} courses logged
        </span>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {candidates.map(m => (
          <AchievementBadgeCard
            key={m.id}
            tier={m.threshold.toString() as AchievementTier}
            title={`${m.threshold} Club`}
            subtitle={`Only ${m.remaining} more`}
            unlocked={false}
            remaining={m.remaining}
            compact
          />
        ))}
      </div>
    </section>
  );
}
