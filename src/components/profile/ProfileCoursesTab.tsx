import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { CourseSnapshotCard } from './courses/CourseSnapshotCard';
import { SeasonOnCourseCard } from './courses/SeasonOnCourseCard';
import { FavouriteCoursesSection } from './courses/FavouriteCoursesSection';
import { SharedCoursesSection } from './courses/SharedCoursesSection';
import { AllCoursesPlayedSection } from './courses/AllCoursesPlayedSection';
import { CourseMilestonesStrip } from './courses/CourseMilestonesStrip';
import { AddCourseModal } from './courses/AddCourseModal';
import { Button } from '@/components/ui/button';
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
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { totalCoursesPlayed, countriesPlayed, isLoading } = useUserCourseSummary(userId);

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

  // Mock data for now - would come from real queries
  const uniqueClubsPlayed = Math.max(1, Math.floor(totalCoursesPlayed * 0.7));
  const newCoursesThisYear = Math.min(totalCoursesPlayed, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-4">
      {/* 1. Your Course Snapshot */}
      <CourseSnapshotCard
        totalCoursesPlayed={totalCoursesPlayed}
        uniqueClubsPlayed={uniqueClubsPlayed}
        newCoursesThisYear={newCoursesThisYear}
        isOwnProfile={isOwnProfile}
        onAddCourse={() => setShowAddModal(true)}
      />

      {/* 2. This Season on Course */}
      {isOwnProfile && (
        <SeasonOnCourseCard
          userId={userId}
          isOwnProfile={isOwnProfile}
          roundsThisSeason={Math.min(totalCoursesPlayed, 12)}
          newCoursesThisSeason={newCoursesThisYear}
        />
      )}

      {/* 3. Favourite Courses (Top 10) */}
      <FavouriteCoursesSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* 4. Courses you share with friends */}
      {isOwnProfile && (
        <SharedCoursesSection userId={userId} isOwnProfile={isOwnProfile} />
      )}

      {/* 5. All Courses Played */}
      <AllCoursesPlayedSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* 6. Course Milestones */}
      <CourseMilestonesStrip
        totalCoursesPlayed={totalCoursesPlayed}
        countriesPlayed={countriesPlayed}
        newCoursesThisYear={newCoursesThisYear}
        isOwnProfile={isOwnProfile}
      />

      {/* Trophy Cabinet Link */}
      {profile && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/achievements/${profile.username}#trophies`)}
          className="w-full"
        >
          <Trophy className="w-4 h-4 mr-2" />
          {isOwnProfile ? 'View Trophy Cabinet' : 'View Season Trophies'}
        </Button>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <AddCourseModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          existingCourseIds={[]}
        />
      )}
    </div>
  );
};