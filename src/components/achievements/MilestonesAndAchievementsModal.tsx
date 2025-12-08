import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
} from '@/lib/achievementDefinitions';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { AchievementBadgeCard, AchievementTier } from './AchievementBadgeCard';
import NudgeBanner from './NudgeBanner';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import { DEBUG_UNLOCK_ALL_ACHIEVEMENTS, DEBUG_ACHIEVEMENTS_USER_EMAIL } from '@/utils/featureFlags';
import { cn } from '@/lib/utils';

interface MilestonesAndAchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map milestone threshold to AchievementTier
function getMilestoneTier(threshold: number): AchievementTier {
  return threshold.toString() as AchievementTier;
}

// Map list ID to AchievementTier
function getListTier(id: string): AchievementTier {
  if (id === 'list_gb_ireland') return 'GBI';
  if (id === 'list_europe') return 'EU';
  if (id === 'list_usa') return 'USA';
  if (id === 'list_worldwide') return 'WORLD';
  return 'WORLD';
}

// Tier-based gradient styling
function getClubGradientClass(tierName?: string) {
  switch (tierName) {
    case 'Rookie Club':
      return 'from-orange-50 via-rose-50 to-slate-50';
    case 'Fairway Club':
      return 'from-lime-50 via-emerald-50 to-slate-50';
    case 'Founders Club':
      return 'from-emerald-100 via-emerald-50 to-slate-50';
    case 'Heritage Club':
      return 'from-amber-50 via-amber-100 to-slate-50';
    case 'Century Club':
      return 'from-slate-100 via-slate-50 to-slate-50';
    case 'Elite Club':
      return 'from-indigo-50 via-violet-50 to-slate-50';
    case 'Legendary Club':
      return 'from-fuchsia-50 via-violet-50 to-slate-50';
    case 'Grand Slam Club':
      return 'from-amber-100 via-amber-50 to-slate-50';
    default:
      return 'from-slate-50 via-slate-50 to-slate-50';
  }
}

/**
 * Top 100 Milestones Modal
 * Premium Apple-level layout with hero progress card and unified badge grid
 * Accessed via "View all" from the Profile Achievements rail
 */
const MilestonesAndAchievementsModal: React.FC<MilestonesAndAchievementsModalProps> = ({
  open,
  onOpenChange,
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

  // 2) Main headline (club name)
  const heroHeadline = currentClub?.tierName || 'Rookie Club';

  // 3) Progress line
  const progressLine = hasCompletedAll
    ? (isOwnProfile
        ? `All ${totalMilestones} milestone clubs unlocked`
        : `${firstName} has unlocked all ${totalMilestones} milestone clubs`)
    : (isOwnProfile
        ? `${unlockedMilestoneCount} of ${totalMilestones} milestone clubs unlocked`
        : `${firstName} has unlocked ${unlockedMilestoneCount} of ${totalMilestones} milestone clubs`);

  // 4) Status line (trophy line)
  const statusLine = hasCompletedAll
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

  // 5) Emblem values
  const emblemValue = totalTop100Played;
  const emblemCaption = emblemValue === 1 ? 'course' : 'courses';

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-full p-0 overflow-hidden"
        hideCloseButton
      >
        <div className="h-full overflow-y-auto bg-background">
          {/* Page header - matches map modal styling */}
          <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40">
            {/* Back link - matches Top100BackButton styling */}
            <button 
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to profile
            </button>

            {/* Title block - centered */}
            <div className="text-center mt-2">
              <h1 className="text-xl font-semibold text-foreground">
                {modalTitle}
              </h1>
            </div>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Nudge banner */}
              {nudge && !isDebugUser && (
                <div className="px-4 md:px-8 mt-4">
                  <NudgeBanner nudge={nudge} variant="compact" />
                </div>
              )}

              {/* Hero banner: Clubs & achievements */}
              <section className="px-4 md:px-8 mt-5 mb-6">
                <div
                  className={cn(
                    'rounded-sq-lg p-5 md:p-6 shadow-lg bg-gradient-to-r',
                    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6',
                    getClubGradientClass(currentClub?.tierName)
                  )}
                >
                  {/* LEFT: Text block */}
                  <div className="flex-1 min-w-0">
                    {/* Small label */}
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">
                      {heroLabel}
                    </p>

                    {/* Main headline (club name) */}
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1 truncate">
                      {heroHeadline}
                    </h2>

                    {/* Progress line */}
                    <p className="text-sm text-slate-600 mb-1">
                      {progressLine}
                    </p>

                    {/* Trophy / status line */}
                    <p className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                      <span aria-hidden="true">🏆</span>
                      <span>{statusLine}</span>
                    </p>
                  </div>

                  {/* RIGHT: Emblem */}
                  <div className="flex-shrink-0 self-center sm:self-auto">
                    <div className="relative px-4 py-2.5 md:px-5 md:py-3 rounded-sq-md flex items-center justify-center shadow-md bg-slate-900 text-slate-50">
                      {/* Number + caption */}
                      <div className="relative flex items-center gap-1.5 leading-tight">
                        <span className="text-lg md:text-2xl font-semibold">
                          {emblemValue}
                        </span>
                        <span className="text-xs md:text-sm uppercase tracking-wide opacity-80">
                          {emblemCaption}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Milestone badges grid */}
              <section className="px-4 md:px-8 pb-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Top 100 milestone clubs
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {MILESTONE_ACHIEVEMENTS.map((milestone) => {
                    const threshold = milestone.threshold ?? 0;
                    // In debug mode, all are unlocked
                    const isUnlocked = isDebugUser ? true : totalTop100Played >= threshold;
                    const isCurrent = currentClub.threshold === threshold;
                    const remaining = Math.max(0, threshold - totalTop100Played);

                    return (
                      <AchievementBadgeCard
                        key={milestone.id}
                        tier={getMilestoneTier(threshold)}
                        title={milestone.shortLabel}
                        subtitle={milestone.label}
                        unlocked={isUnlocked}
                        isPrimary={isCurrent}
                        remaining={isUnlocked ? undefined : remaining}
                        totalTop100Played={isUnlocked ? totalTop100Played : undefined}
                      />
                    );
                  })}
                </div>
              </section>

              {/* List completion badges grid */}
              <section className="px-4 md:px-8 pb-10">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Completed Top 100 lists
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                    const remaining = Math.max(0, total - played);
                    
                    // In debug mode, all are unlocked
                    const isUnlocked = isDebugUser ? true : (played >= total && total > 0);

                    return (
                      <AchievementBadgeCard
                        key={list.id}
                        tier={getListTier(list.id)}
                        title={list.shortLabel}
                        subtitle={`${played} / ${total} courses`}
                        unlocked={isUnlocked}
                        remaining={isUnlocked ? undefined : remaining}
                        playedOnList={played}
                        totalOnList={total}
                      />
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MilestonesAndAchievementsModal;
