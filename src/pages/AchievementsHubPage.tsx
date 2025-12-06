import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import AchievementBadgeCard from '@/components/achievements/AchievementBadgeCard';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
  LIST_SLUG_TO_ACHIEVEMENT_ID,
} from '@/lib/achievementDefinitions';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';

/**
 * AchievementsHubPage - Gamified trophy room for user achievements
 * Route: /achievementshub
 */
const AchievementsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  
  // Get user profile for avatar/username
  const { data: profile } = useQuery({
    queryKey: ['user-profile-basic', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, display_name, profile_photo_url')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Get Top 100 progress data
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);

  const isLoading = authLoading || progressLoading;
  const totalPlayed = progressData?.totalTop100Played ?? 0;
  const lists = progressData?.lists ?? [];

  // Calculate unlocked milestones
  const unlockedMilestoneIds = MILESTONE_ACHIEVEMENTS
    .filter(m => m.threshold !== undefined && totalPlayed >= m.threshold)
    .map(m => m.id);

  // Calculate completed lists
  const completedListIds: string[] = [];
  for (const list of lists) {
    if (list.played >= list.total && list.total > 0) {
      const achievementId = LIST_SLUG_TO_ACHIEVEMENT_ID[list.listSlug];
      if (achievementId) {
        completedListIds.push(achievementId);
      }
    }
  }

  // Get next milestone
  const nextClub = getNextTop100Club(totalPlayed);
  const currentClub = getTop100Club(totalPlayed);

  const username = profile?.username || 'golfer';
  const displayName = profile?.display_name || username;
  const avatarUrl = profile?.profile_photo_url;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-24 md:px-8 md:pt-8">
        
        {/* Top Bar */}
        <header className="flex items-center justify-between mb-4 md:mb-6">
          <button 
            onClick={handleBack} 
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">Achievements</h1>
          <div className="w-8" /> {/* Spacer to balance layout */}
        </header>

        {/* Progress Hero */}
        <section className="mb-6 md:mb-8">
          <div className="rounded-sq-lg bg-card border border-border/60 shadow-lg px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3">
            {/* Top row: Avatar + text summary */}
            <div className="flex items-center gap-3 md:gap-4">
              <SquircleAvatar 
                src={avatarUrl} 
                size="sm" 
                alt={displayName}
                ringColor={currentClub.ringColor}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  @{username} · {totalPlayed} Top 100 courses played
                </p>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  {unlockedMilestoneIds.length} milestone{unlockedMilestoneIds.length === 1 ? '' : 's'} unlocked · {completedListIds.length} list{completedListIds.length === 1 ? '' : 's'} completed
                </p>
              </div>
            </div>

            {/* Progress bar to next milestone */}
            {nextClub && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] md:text-xs text-muted-foreground">
                  <span>Progress to next milestone</span>
                  <span>{totalPlayed} / {nextClub.threshold} courses</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (totalPlayed / nextClub.threshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Next badge pill */}
            {nextClub && (
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-card px-3 py-1 text-[11px] md:text-xs shadow-sm border border-border/40">
                <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  Next: {nextClub.threshold} Club
                </span>
                <span className="text-muted-foreground">
                  {nextClub.threshold - totalPlayed} more to go
                </span>
              </div>
            )}

            {/* Max milestone reached state */}
            {!nextClub && totalPlayed >= 400 && (
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1 text-[11px] md:text-xs shadow-sm border border-amber-200">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-medium text-amber-700">
                  Grand Slam Club achieved!
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Section 1: Top 100 Milestones */}
        <section className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Top 100 Milestones</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {MILESTONE_ACHIEVEMENTS.map(m => {
              const isUnlocked = m.threshold !== undefined && totalPlayed >= m.threshold;
              return (
                <AchievementBadgeCard
                  key={m.id}
                  title={m.shortLabel}
                  subtitle={m.label}
                  status={isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  type="MILESTONE"
                  accentColor={m.ringColor}
                />
              );
            })}
          </div>
        </section>

        {/* Section 2: Top 100 Lists Completed */}
        <section className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Top 100 Lists Completed</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {LIST_ACHIEVEMENTS.map(list => {
              const isUnlocked = completedListIds.includes(list.id);
              return (
                <AchievementBadgeCard
                  key={list.id}
                  title={list.shortLabel}
                  subtitle={list.label}
                  status={isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  type="LIST"
                  accentColor={list.ringColor}
                />
              );
            })}
          </div>
        </section>

        {/* Section 3: Skill Achievements (Future-proofed) */}
        {/* Hidden when empty - will be populated with handicap, PB rounds, hole-in-one, etc. */}
        {false && (
          <section className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Skill Achievements</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 -ml-4 pl-4 md:ml-0 md:pl-0">
              {/* Skill achievement cards will go here */}
            </div>
          </section>
        )}

        {/* Section 4: Seasonal / Limited Events (Hidden if empty) */}
        {/* Prepared but hidden until we have seasonal achievements */}
        {false && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Seasonal & Limited Events</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Seasonal achievement cards will go here */}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default AchievementsHubPage;
