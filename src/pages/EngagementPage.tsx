import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { getUnlockedMilestoneAchievements, getUnlockedListAchievements } from '@/lib/achievementDefinitions';
import { getNextTop100Club } from '@/lib/top100Club';

import AchievementsProgressHero from '@/components/achievements/AchievementsProgressHero';
import MilestonesSection from '@/components/achievements/MilestonesSection';
import ListsCompletedSection from '@/components/achievements/ListsCompletedSection';
import SkillAchievementsSection from '@/components/achievements/SkillAchievementsSection';
import SeasonalAchievementsSection from '@/components/achievements/SeasonalAchievementsSection';

const EngagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);

  const isLoading = sessionLoading || profileLoading || progressLoading;

  const handleBack = () => {
    navigate(-1);
  };

  // Compute achievement data
  const totalTop100Played = progressData?.totalTop100Played ?? 0;
  const lists = (progressData?.lists || []).map(l => ({
    listSlug: l.listSlug,
    played: l.played,
    total: l.total,
  }));

  const unlockedMilestones = getUnlockedMilestoneAchievements(totalTop100Played);
  const unlockedLists = getUnlockedListAchievements(lists);
  const nextClub = getNextTop100Club(totalTop100Played);

  const username = profile?.username || user?.email?.split('@')[0] || 'golfer';
  const avatarUrl = profile?.profile_photo_url;

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
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold">Achievements</h1>
          <div className="w-8" /> {/* Spacer to balance layout */}
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Progress Hero */}
            <AchievementsProgressHero
              username={username}
              avatarUrl={avatarUrl}
              totalTop100Played={totalTop100Played}
              unlockedMilestonesCount={unlockedMilestones.length}
              completedListsCount={unlockedLists.length}
              nextMilestone={nextClub?.threshold ?? null}
            />

            {/* Top 100 Milestones */}
            <MilestonesSection totalTop100Played={totalTop100Played} />

            {/* Top 100 Lists Completed */}
            <ListsCompletedSection lists={lists} />

            {/* Skill Achievements (future-proofed, hidden when empty) */}
            <SkillAchievementsSection skillAchievements={[]} />

            {/* Seasonal Achievements (future-proofed, hidden when empty) */}
            <SeasonalAchievementsSection seasonalAchievements={[]} />
          </>
        )}
      </div>
    </div>
  );
};

export default EngagementPage;
