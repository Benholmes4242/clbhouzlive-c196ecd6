import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
} from '@/lib/achievementDefinitions';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { EliteGameCard, EliteCardTier } from './EliteGameCard';
import NudgeBanner from './NudgeBanner';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import { DEBUG_UNLOCK_ALL_ACHIEVEMENTS, DEBUG_ACHIEVEMENTS_USER_EMAIL } from '@/utils/featureFlags';
import { cn } from '@/lib/utils';
import { MILESTONE_THEMES, MilestoneTier } from '@/lib/globalAchievementMilestoneSystem';
import { AchievementsSkeleton } from '@/components/skeletons/AchievementsSkeleton';

interface MilestonesAndAchievementsContentProps {
  /** Called when user clicks back. If not provided, back button is hidden. */
  onBack?: () => void;
  /** Custom back button label */
  backLabel?: string;
}

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

// Get inline style for hero card background from global system
function getClubHeroStyle(threshold: number): React.CSSProperties {
  const theme = MILESTONE_THEMES[threshold as MilestoneTier];
  if (!theme) {
    return { background: '#F8FAFC' }; // neutral fallback
  }
  return {
    background: `linear-gradient(135deg, ${theme.bgLight}, ${theme.bgDark})`,
  };
}

// Neutral card style for empty state
const EMPTY_STATE_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
};

/**
 * Top 100 Milestones & Achievements Content
 * Premium Apple-level layout with hero progress card and unified badge grid
 * This is the pure content component - can be used in modals or standalone pages
 */
export const MilestonesAndAchievementsContent: React.FC<MilestonesAndAchievementsContentProps> = ({
  onBack,
  backLabel = 'Back to profile',
}) => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);

  const isLoading = sessionLoading || profileLoading || progressLoading;

  // Check if debug mode should apply (only for Benjamin Holmes)
  const isDebugUser = DEBUG_UNLOCK_ALL_ACHIEVEMENTS && user?.email === DEBUG_ACHIEVEMENTS_USER_EMAIL;

  // In debug mode, show all as unlocked with 400 courses
  const totalTop100Played = isDebugUser ? 400 : (progressData?.totalTop100Played ?? 0);

  // Derive a friendly first name
  const rawName =
    profile?.display_name ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    'Golfer';
  const firstName = rawName.split(' ')[0];

  const totalMilestones = MILESTONE_ACHIEVEMENTS.length;
  const totalLists = LIST_ACHIEVEMENTS.length;
  
  // In debug mode, all are unlocked
  const unlockedMilestoneCount = isDebugUser ? totalMilestones : MILESTONE_ACHIEVEMENTS.filter(m => totalTop100Played >= (m.threshold ?? 0)).length;
  const unlockedListCount = isDebugUser ? totalLists : 0; // Real list completion logic would go here
  const unlockedCount = unlockedMilestoneCount + unlockedListCount;

  const currentClub = getTop100Club(totalTop100Played);
  const nextClub = getNextTop100Club(totalTop100Played);

  // Progress to next milestone
  const coursesToNext = nextClub ? nextClub.threshold - totalTop100Played : 0;
  const hasCompletedAll = unlockedMilestoneCount === totalMilestones;
  
  // Determine if user has a club (< 5 = no club yet)
  const hasClub = totalTop100Played >= 5;
  const firstClubThreshold = 5;
  const coursesToRookie = Math.max(firstClubThreshold - totalTop100Played, 0);
  
  // Viewer vs profile owner - determine if viewing own profile
  const viewerId = user?.id;
  const ownerId = profile?.id ?? null;
  const isOwnProfile = viewerId != null && ownerId != null
    ? viewerId === ownerId
    : true; // fallback to "own" if we can't determine

  const coursesForNextLevel = nextClub?.threshold ?? null;

  // Dynamic copy with smart apostrophe
  const modalTitle = isOwnProfile
    ? "Your Clubs & Achievements"
    : `${firstName}'s Clubs & Achievements`;

  // 1) Hero label (small caps)
  const heroLabel = isOwnProfile
    ? 'Your clubs & achievements'
    : `${firstName}'s clubs & achievements`;

  // 2) Main headline - changes based on hasClub
  const heroHeadline = hasClub 
    ? (currentClub?.tierName || 'Rookie Club')
    : (isOwnProfile ? 'Your first club is waiting' : `${firstName} hasn't joined a club yet`);

  // 3) Progress line
  const progressLine = !hasClub
    ? (isOwnProfile
        ? `Play ${coursesToRookie} more Top 100 courses to join Rookie Club`
        : 'First club unlocks at 5 Top 100 courses played')
    : hasCompletedAll
      ? (isOwnProfile
          ? `All ${totalMilestones} milestone clubs unlocked`
          : `${firstName} has unlocked all ${totalMilestones} milestone clubs`)
      : (isOwnProfile
          ? `${unlockedMilestoneCount} of ${totalMilestones} milestone clubs unlocked`
          : `${firstName} has unlocked ${unlockedMilestoneCount} of ${totalMilestones} milestone clubs`);

  // 4) Status line (trophy line)
  const statusLine = !hasClub
    ? (isOwnProfile ? 'Rookie Club unlocks at 5 courses played' : '')
    : hasCompletedAll
      ? (isOwnProfile
          ? `Grand Slam complete – ${totalTop100Played} courses played`
          : `Grand Slam complete – ${firstName} has played ${totalTop100Played} courses`)
      : coursesForNextLevel != null
        ? (isOwnProfile
            ? `Next club: ${nextClub?.tierName} – ${coursesForNextLevel - totalTop100Played} more to go`
            : `Next for ${firstName}: ${nextClub?.tierName} – ${coursesForNextLevel - totalTop100Played} more to go`)
        : (isOwnProfile
            ? 'Keep logging Top 100 rounds to unlock your next club'
            : `${firstName} is closing in on the next club`);

  // Hero card style - uses club color or neutral for empty state
  const heroStyle = hasClub && currentClub 
    ? getClubHeroStyle(currentClub.threshold)
    : EMPTY_STATE_STYLE;

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
    <div className="flex h-full flex-col bg-background">
      {/* Page header */}
      <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40">
        {/* Back link - only shown if onBack is provided */}
        {onBack && (
          <button 
            onClick={onBack}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </button>
        )}

        {/* Title block - centered */}
        <div className={cn("text-center", onBack ? "mt-2" : "")}>
          <h1 className="text-xl font-semibold text-foreground">
            {modalTitle}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <AchievementsSkeleton />
        ) : (
          <>
            {/* Nudge banner */}
            {nudge && !isDebugUser && (
              <div className="px-2.5 md:px-5 mt-4">
                <NudgeBanner nudge={nudge} variant="compact" />
              </div>
            )}

            {/* Hero banner: Clubs & achievements */}
            <section className="px-2.5 md:px-5 mt-5 mb-6">
              <div
                className="rounded-sq-lg p-5 md:p-6 shadow-lg"
                style={heroStyle}
              >
                <div className="flex flex-col gap-2 md:gap-2.5">
                  {/* Label */}
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-[0.12em]",
                    hasClub ? "text-slate-500" : "text-slate-400"
                  )}>
                    {heroLabel}
                  </p>

                  {/* TITLE + EMBLEM ROW */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Club title */}
                    <h2 className={cn(
                      "text-xl md:text-2xl font-semibold truncate",
                      hasClub ? "text-slate-900" : "text-slate-700"
                    )}>
                      {heroHeadline}
                    </h2>

                    {/* Courses emblem – SDS pill style */}
                    <div className={cn(
                      "inline-flex items-center justify-center px-3 py-1.5 md:px-3.5 md:py-1.5",
                      "rounded-sq-pill text-xs md:text-sm font-semibold shadow-sm whitespace-nowrap",
                      hasClub 
                        ? "bg-surface-slate text-slate-50" 
                        : "bg-slate-200 text-slate-600"
                    )}>
                      {totalTop100Played} {totalTop100Played === 1 ? 'course' : 'courses'}
                    </div>
                  </div>

                  {/* Progress line */}
                  <p className={cn(
                    "text-sm max-w-full",
                    hasClub ? "text-slate-700" : "text-slate-500"
                  )}>
                    {progressLine}
                  </p>

                  {/* Trophy / status line - hidden for empty state with no content */}
                  {statusLine && (
                    <p className={cn(
                      "flex items-center gap-1.5 text-sm font-medium max-w-full",
                      hasClub ? "text-amber-700" : "text-slate-400"
                    )}>
                      <span aria-hidden="true" className={hasClub ? "" : "opacity-50"}>🏆</span>
                      <span>{statusLine}</span>
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Milestone badges grid */}
            <section className="px-2.5 md:px-5 pb-6">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-3">
                Top 100 milestone clubs
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {MILESTONE_ACHIEVEMENTS.map((milestone) => {
                  const threshold = milestone.threshold ?? 0;
                  // In debug mode, all are unlocked
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
            <section className="px-2.5 md:px-5 pb-10">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-3">
                Completed Top 100 lists
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {LIST_ACHIEVEMENTS.map((list) => {
                  // Get list progress for this region
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
                  
                  // In debug mode, all are unlocked
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
      </div>
    </div>
  );
};

export default MilestonesAndAchievementsContent;
