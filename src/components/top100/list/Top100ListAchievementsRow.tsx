import React from 'react';
import { TOP100_LIST_MILESTONES } from '@/config/top100ListMilestones';

// Tier colors matching My Progress
const TIER_COLORS: Record<number, string> = {
  5: '#D9C7A3',
  10: '#8BBF5A',
  20: '#2E5930',
  25: '#2E5930',
  50: '#C8A44B',
  75: '#B7BCC6',
  100: '#0C0F14',
};

interface Top100ListAchievementsRowProps {
  listName: string;
  listSlug?: string;
  playedCount: number;
  totalCount: number;
}

// Dynamic achievement title based on list
const getAchievementsTitleForList = (listSlug?: string): string => {
  switch (listSlug) {
    case 'global':
      return 'Worldwide achievements';
    case 'gb-i':
      return 'GB&I achievements';
    case 'usa':
      return 'USA achievements';
    case 'europe':
      return 'Europe achievements';
    default:
      return 'List achievements';
  }
};

// Short name for "complete" badge label
const getCompleteLabel = (listSlug?: string): string => {
  switch (listSlug) {
    case 'global':
      return 'Worldwide Top 100 complete';
    case 'gb-i':
      return 'GB&I Top 100 complete';
    case 'usa':
      return 'USA Top 100 complete';
    case 'europe':
      return 'Europe Top 100 complete';
    default:
      return 'Top 100 complete';
  }
};

// Maps playedCount → percentage across achievements (evenly spaced circles)
function getAchievementsProgressPct(playedCount: number, milestones: { threshold: number }[], maxThreshold: number): number {
  if (playedCount <= 0) return 0;
  if (playedCount >= maxThreshold) return 100;

  const validMilestones = milestones.filter(m => m.threshold <= maxThreshold);
  const thresholds = validMilestones.map(m => m.threshold);
  
  if (thresholds.length <= 1) return playedCount >= maxThreshold ? 100 : 0;

  const lastIndex = thresholds.length - 1;
  const segmentSize = 100 / lastIndex;

  let i = 0;
  for (let idx = 0; idx < lastIndex; idx++) {
    if (playedCount <= thresholds[idx + 1]) {
      i = idx;
      break;
    }
  }

  const startThreshold = i === 0 ? 0 : thresholds[i];
  const endThreshold = thresholds[i + 1];

  const base = (i / lastIndex) * 100;
  const ratio = (playedCount - startThreshold) / (endThreshold - startThreshold);
  const pct = base + ratio * segmentSize;

  return Math.max(0, Math.min(100, pct));
}

export const Top100ListAchievementsRow: React.FC<Top100ListAchievementsRowProps> = ({
  listName,
  listSlug,
  playedCount,
  totalCount,
}) => {
  const milestones = TOP100_LIST_MILESTONES.filter(m => m.threshold <= totalCount || m.threshold === 100);
  const maxThreshold = Math.min(milestones[milestones.length - 1]?.threshold ?? 100, totalCount);
  const progressPct = getAchievementsProgressPct(playedCount, milestones, maxThreshold);

  return (
    <section className="space-y-2 mt-6">
      <div className="flex items-baseline justify-between px-5">
        <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          {getAchievementsTitleForList(listSlug)}
        </h3>
        <p className="text-xs text-muted-foreground">
          {playedCount} / {totalCount} courses played
        </p>
      </div>

      {/* Outer scroller */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        {/* Inner column that scrolls together */}
        <div className="inline-flex flex-col gap-3 min-w-full px-4">
          {/* Row of circles */}
          <div className="flex gap-4">
            {milestones.map((m) => {
              const unlocked = playedCount >= m.threshold;
              const remaining = Math.max(0, m.threshold - playedCount);
              const isListComplete = m.threshold >= totalCount;
              const tierColor = TIER_COLORS[m.threshold] || '#94a3b8';

              // Badge label
              const badgeLabel = isListComplete 
                ? getCompleteLabel(listSlug)
                : `${m.threshold} Club`;

              return (
                <div
                  key={m.threshold}
                  className="flex flex-col items-center min-w-[72px] gap-1"
                >
                  {/* Squircle ring */}
                  <div className="relative">
                    <div
                      className="h-14 w-14 rounded-[18px] flex items-center justify-center bg-white"
                      style={{
                        boxShadow: unlocked
                          ? `0 0 18px ${tierColor}22`
                          : '0 0 10px rgba(15,23,42,0.06)',
                        border: `2px solid ${unlocked ? tierColor : `${tierColor}66`}`,
                        opacity: unlocked ? 1 : 0.45,
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: tierColor }}>
                        {m.threshold}
                      </span>
                    </div>
                  </div>

                  {/* Labels - consistent two lines */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-foreground whitespace-nowrap">
                      {badgeLabel}
                    </p>
                    <p className="text-[11px] leading-[1.2] text-muted-foreground">
                      {unlocked ? 'Unlocked' : `${remaining} away`}
                    </p>
                  </div>
                </div>
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
};
