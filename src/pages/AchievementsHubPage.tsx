import React from 'react';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
} from '@/lib/achievementDefinitions';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { EliteGameCard, EliteCardTier } from '@/components/achievements/EliteGameCard';
import { AchievementsSkeleton } from '@/components/skeletons/AchievementsSkeleton';
import NudgeBanner from '@/components/achievements/NudgeBanner';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { DEBUG_UNLOCK_ALL_ACHIEVEMENTS, DEBUG_ACHIEVEMENTS_USER_EMAIL } from '@/utils/featureFlags';

// Map milestone threshold to EliteCardTier
function getMilestoneTier(threshold: number): EliteCardTier {
  return threshold.toString() as EliteCardTier;
}

// Map list ID to EliteCardTier
function getListTier(id: string): EliteCardTier {
  if (id === 'list_gb_ireland') return 'GBI';
  if (id === 'list_europe') return 'EU';
  if (id === 'list_usa') return 'USA';
  if (id === 'list_worldwide') return 'WORLD';
  return 'WORLD';
}

/**
 * AchievementsHubPage - Full page version of Top 100 Milestones
 * Premium Apple-level layout with hero progress card and unified badge grid
 */
const AchievementsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);

  const isLoading = sessionLoading || profileLoading || progressLoading;

  // Check if debug mode should apply (only for Benjamin Holmes)
  const isDebugUser = DEBUG_UNLOCK_ALL_ACHIEVEMENTS && user?.email === DEBUG_ACHIEVEMENTS_USER_EMAIL;

  // In debug mode, show all as unlocked with 400 courses
  const totalTop100Played = isDebugUser ? 400 : (progressData?.totalTop100Played ?? 0);

  const username = profile?.username || user?.email?.split('@')[0] || 'golfer';
  const totalMilestones = MILESTONE_ACHIEVEMENTS.length;
  const totalLists = LIST_ACHIEVEMENTS.length;
  
  // In debug mode, all are unlocked
  const unlockedMilestoneCount = isDebugUser ? totalMilestones : MILESTONE_ACHIEVEMENTS.filter(m => totalTop100Played >= (m.threshold ?? 0)).length;
  const unlockedListCount = isDebugUser ? totalLists : 0;
  const unlockedCount = unlockedMilestoneCount + unlockedListCount;

  const currentClub = getTop100Club(totalTop100Played);
  const nextClub = getNextTop100Club(totalTop100Played);

  // Progress to next milestone
  const coursesToNext = nextClub ? nextClub.threshold - totalTop100Played : 0;
  const progressToNext = nextClub 
    ? Math.min(100, (totalTop100Played / nextClub.threshold) * 100) 
    : 100;

  // Calculate nudge
  const nudge = progressData?.lists ? getNextBadgeNudge({
    totalTop100Played,
    lists: progressData.lists.map(l => {
      const regionMap: Record<string, 'GBI' | 'USA' | 'EU' | 'WORLD'> = {
        'gb-i': 'GBI',
        'usa': 'USA',
        'europe': 'EU',
        'global': 'WORLD',
      };
      return {
        regionId: regionMap[l.listSlug] || 'WORLD',
        played: l.played,
        total: l.total,
      };
    }),
  }) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <header className="px-4 pt-4 pb-2 md:px-8 md:pt-6 md:pb-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-base md:text-lg font-semibold tracking-tight">
          Top 100 milestones
        </h1>

        <div className="w-8" />
      </header>

      {isLoading ? (
        <AchievementsSkeleton />
      ) : (
        <>
          {/* Summary line */}
          <p className="px-4 md:px-8 text-xs md:text-sm text-slate-500 mb-3">
            @{username} · {totalTop100Played} Top 100 courses · {unlockedCount} milestones unlocked
          </p>

          {/* Nudge banner */}
          {nudge && !isDebugUser && (
            <div className="px-4 md:px-8">
              <NudgeBanner nudge={nudge} variant="compact" />
            </div>
          )}

          {/* Hero "Progress" card */}
          <section className="px-4 md:px-8 mb-5">
            <div
              className="
                rounded-3xl
                bg-white/90
                shadow-[0_18px_45px_rgba(15,23,42,0.18)]
                px-4 py-4 md:px-6 md:py-5
                flex flex-col gap-3
              "
            >
              {/* Row 1: title + unlocked count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Top 100 milestones
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {unlockedMilestoneCount} of {totalMilestones} unlocked
                    </div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-[3px] rounded-full bg-slate-900 text-white uppercase tracking-wide">
                  {totalTop100Played} courses
                </span>
              </div>

              {/* Row 2: current & next */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm">
                  <span className="text-slate-500">Current level </span>
                  <span className="font-semibold text-slate-900">
                    {currentClub.tierName || 'Beginner'}
                  </span>
                </div>
                {nextClub && (
                  <div className="text-[11px] text-slate-600">
                    Next: <span className="font-semibold">{nextClub.tierName}</span> · {coursesToNext} more courses
                  </div>
                )}
              </div>

              {/* Row 3: progress bar */}
              {nextClub && (
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              )}

              {/* All milestones complete */}
              {!nextClub && totalTop100Played >= 400 && (
                <div className="text-[11px] text-amber-700 font-medium">
                  🏆 Grand Slam Club achieved!
                </div>
              )}
            </div>
          </section>

          {/* Milestone badges grid */}
          <section className="px-4 md:px-8 pb-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Milestone badges
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {MILESTONE_ACHIEVEMENTS.map((milestone) => {
                const threshold = milestone.threshold ?? 0;
                const isUnlocked = isDebugUser ? true : totalTop100Played >= threshold;

                return (
                  <EliteGameCard
                    key={milestone.id}
                    tier={getMilestoneTier(threshold)}
                    earned={isUnlocked}
                    currentProgress={totalTop100Played}
                    title={milestone.shortLabel}
                    subtitle={milestone.label}
                    enableAnimations={false}
                    quality="medium"
                  />
                );
              })}
            </div>
          </section>

          {/* List completion badges grid */}
          <section className="px-4 md:px-8 pb-10">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Regional lists
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {LIST_ACHIEVEMENTS.map((list) => {
                const listSlugMap: Record<string, string> = {
                  'list_gb_ireland': 'gb-i',
                  'list_europe': 'europe',
                  'list_usa': 'usa',
                  'list_worldwide': 'global',
                };
                const slug = listSlugMap[list.id];
                const listProgress = progressData?.lists?.find(l => l.listSlug === slug);
                const played = listProgress?.played ?? 0;
                const total = listProgress?.total ?? 100;
                
                const isUnlocked = isDebugUser ? true : (played >= total && total > 0);

                return (
                  <EliteGameCard
                    key={list.id}
                    tier={getListTier(list.id)}
                    earned={isUnlocked}
                    currentProgress={played}
                    targetProgress={total}
                    title={list.shortLabel}
                    subtitle={`${played} / ${total} courses`}
                    enableAnimations={false}
                    quality="medium"
                  />
                );
              })}
            </div>
          </section>
        </>
      )}
      <ScrollToTopGlass />
    </div>
  );
};

export default AchievementsHubPage;
