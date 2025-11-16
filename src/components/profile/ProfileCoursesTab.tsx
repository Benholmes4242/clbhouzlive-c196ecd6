import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, Globe, ArrowRight } from 'lucide-react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { TopTenEditor } from './courses/TopTenEditor';
import { CoursesPlayedGrid } from './courses/CoursesPlayedGrid';
import { FriendComparisonSection } from './courses/FriendComparisonSection';
import { ProfileRecentAchievementsStrip } from './ProfileRecentAchievementsStrip';
import { ProfileAchievementsPanel } from './ProfileAchievementsPanel';
import { GolfJourneyXPChip } from './GolfJourneyXPChip';
import { SeasonStatusCard } from './SeasonStatusCard';
import { Button } from '@/components/ui/button';
import { useAchievementSharing } from '@/hooks/useAchievementSharing';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCoursesTabProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileCoursesTab: React.FC<ProfileCoursesTabProps> = ({
  userId,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const { prepareAchievementShare } = useAchievementSharing();
  const { totalCoursesPlayed, countriesPlayed, top100Progress, isLoading } =
    useUserCourseSummary(userId);

  // Fetch username for navigation
  const { data: profile } = useQuery<{ username: string } | null>({
    queryKey: ['profile-username', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles' as any)
        .select('username')
        .eq('id', userId)
        .single();
      return data ? (data as unknown as { username: string }) : null;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Golf Journey Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Golf Journey</h2>
          <GolfJourneyXPChip userId={userId} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Courses Played */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalCoursesPlayed}</div>
            </div>
            <div className="text-sm text-muted-foreground">Courses Played</div>
          </div>

          {/* Countries Played */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{countriesPlayed}</div>
            </div>
            <div className="text-sm text-muted-foreground">Countries Played</div>
          </div>

          {/* Top 100 Progress Cards */}
          {top100Progress.slice(0, 2).map((progress) => (
            <div
              key={progress.listSlug}
              onClick={() => navigate(`/top100/${progress.listSlug}`)}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">
                  {progress.played}/{progress.total}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {progress.listName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements Strip */}
      <ProfileRecentAchievementsStrip userId={userId} isOwnProfile={isOwnProfile} />

      {/* Season Status - Own Profile Only */}
      {isOwnProfile && <SeasonStatusCard userId={userId} />}

      {/* Full Achievements Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">All Achievements</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isOwnProfile ? '/achievements' : `/achievements/${profile?.username}`)}
            className="text-sm"
          >
            View Full Achievements Hub
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <ProfileAchievementsPanel userId={userId} isOwnProfile={isOwnProfile} onShareAchievement={prepareAchievementShare} />
      </div>

      {/* Friend Comparison - only for own profile */}
      {isOwnProfile && (
        <FriendComparisonSection userId={userId} />
      )}

      {/* Top 10 Editor */}
      <TopTenEditor userId={userId} isOwnProfile={isOwnProfile} />

      {/* Courses Played Grid */}
      <CoursesPlayedGrid userId={userId} />
    </div>
  );
};
