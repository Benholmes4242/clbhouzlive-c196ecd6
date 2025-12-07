import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import Top100TrophyIcon from '@/components/icons/Top100TrophyIcon';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';

interface AchievementsProgressHeroProps {
  username: string;
  avatarUrl?: string | null;
  totalTop100Played: number;
  unlockedMilestonesCount: number;
  completedListsCount: number;
  nextMilestone: number | null;
}

export const AchievementsProgressHero: React.FC<AchievementsProgressHeroProps> = ({
  username,
  avatarUrl,
  totalTop100Played,
  unlockedMilestonesCount,
  completedListsCount,
  nextMilestone,
}) => {
  // Get ring color directly from global achievement system
  const ringColor = getRingColorForTotalPlayed(totalTop100Played);
  const progress = nextMilestone 
    ? Math.min(100, (totalTop100Played / nextMilestone) * 100)
    : 100;
  const remaining = nextMilestone ? nextMilestone - totalTop100Played : 0;

  return (
    <section className="mb-6 md:mb-8">
      <div 
        className="rounded-sq-lg border border-white/60 shadow-lg px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3"
        style={{
          background: 'radial-gradient(circle at top, hsl(142 76% 96%), hsl(210 40% 98%))',
        }}
      >
        {/* Top row: Avatar + text summary */}
        <div className="flex items-center gap-3 md:gap-4">
          <SquircleAvatar 
            src={avatarUrl} 
            size="sm" 
            alt={username}
            fallback={username.charAt(0).toUpperCase()}
            ringColor={ringColor}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              @{username} • {totalTop100Played} Top 100 courses played
            </p>
            <p className="text-sm md:text-base font-semibold">
              {unlockedMilestonesCount} milestone{unlockedMilestonesCount === 1 ? '' : 's'} unlocked · {completedListsCount} list{completedListsCount === 1 ? '' : 's'} completed
            </p>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] md:text-xs text-muted-foreground">
              <span>Progress to next milestone</span>
              <span>{totalTop100Played} / {nextMilestone} courses</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Next badge pill */}
        {nextMilestone && (
          <div className="inline-flex items-center gap-2 self-start rounded-sq-pill bg-white/80 px-3 py-1.5 text-[11px] md:text-xs shadow-sm">
            <Top100TrophyIcon className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-emerald-700">
              Next: {nextMilestone} Club
            </span>
            <span className="text-muted-foreground">
              {remaining} more to go
            </span>
          </div>
        )}

        {/* All milestones complete */}
        {!nextMilestone && totalTop100Played >= 400 && (
          <div className="inline-flex items-center gap-2 self-start rounded-sq-pill bg-white/80 px-3 py-1.5 text-[11px] md:text-xs shadow-sm">
            <Top100TrophyIcon className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-700">
              Grand Slam Club achieved!
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementsProgressHero;
