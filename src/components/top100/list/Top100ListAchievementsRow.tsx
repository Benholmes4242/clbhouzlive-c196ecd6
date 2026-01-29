import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOP100_LIST_MILESTONES } from '@/config/top100ListMilestones';
import { getRegionTheme } from '@/lib/globalAchievementMilestoneSystem';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

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

// Map list slug to EliteCardTier
const getListTier = (listSlug?: string): EliteCardTier => {
  switch (listSlug) {
    case 'global': return 'WORLD';
    case 'gb-i': return 'GBI';
    case 'usa': return 'USA';
    case 'europe': return 'EU';
    default: return 'WORLD';
  }
};

// Short name for badge subtitle
const getListSubtitle = (listSlug?: string): string => {
  switch (listSlug) {
    case 'global': return 'Global Top 100';
    case 'gb-i': return 'GB&I Top 100';
    case 'usa': return 'USA Top 100';
    case 'europe': return 'Europe Top 100';
    default: return 'Top 100';
  }
};

// Maps playedCount → percentage across achievements
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
  const navigate = useNavigate();
  const milestones = TOP100_LIST_MILESTONES.filter(m => m.threshold <= totalCount || m.threshold === 100);
  const maxThreshold = Math.min(milestones[milestones.length - 1]?.threshold ?? 100, totalCount);
  const progressPct = getAchievementsProgressPct(playedCount, milestones, maxThreshold);

  // Use unified theme system for region colors
  const regionTheme = getRegionTheme(listSlug ?? 'global');
  const listTier = getListTier(listSlug);

  return (
    <section className="space-y-2 mt-6">
      <div className="flex flex-col gap-0.5 px-5">
        <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          {getAchievementsTitleForList(listSlug)}
        </h3>
        <p className="text-[11px] text-muted-foreground/70">
          Milestones on this list only
        </p>
      </div>
      <div className="flex items-baseline justify-between px-5">
        <button
          onClick={() => navigate('/achievementshub')}
          className="text-xs text-primary hover:text-primary/80 font-medium"
        >
          View all milestones →
        </button>
        <p className="text-xs text-muted-foreground">
          {playedCount} / {totalCount} courses played
        </p>
      </div>

      {/* Outer scroller */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        {/* Inner column that scrolls together */}
        <div className="inline-flex flex-col gap-3 min-w-full px-4">
          {/* Row of EliteGameCards */}
          <div className="flex gap-3">
            {milestones.map((m) => {
              const unlocked = playedCount >= m.threshold;
              const isListComplete = m.threshold >= totalCount;

              // Badge title
              const badgeTitle = isListComplete 
                ? `${getListSubtitle(listSlug)} Complete`
                : `${m.threshold} Club`;

              return (
                <EliteGameCard
                  key={m.threshold}
                  tier={listTier}
                  earned={unlocked}
                  currentProgress={playedCount}
                  targetProgress={m.threshold}
                  title={badgeTitle}
                  subtitle={isListComplete ? 'List Complete' : 'Milestone'}
                  compact
                  enableAnimations={false}
                  quality="low"
                />
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted/80 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${progressPct}%`,
                backgroundColor: regionTheme.bgDark,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
