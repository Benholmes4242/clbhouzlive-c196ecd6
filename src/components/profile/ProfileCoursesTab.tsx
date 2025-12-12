import React, { useState } from 'react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { JourneyHero } from './courses/JourneyHero';
import { CourseDNA } from './courses/CourseDNA';
import { FavouritesShowcase } from './courses/FavouritesShowcase';
import { AllCoursesList } from './courses/AllCoursesList';
import { AddCourseModal } from './courses/AddCourseModal';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
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
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { totalCoursesPlayed, countriesPlayed, isLoading } = useUserCourseSummary(userId);

  // Fetch additional stats for CourseDNA
  const { data: statsData } = useQuery({
    queryKey: ['user-course-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Get average rating and Top 100 count
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('is_mock', false);

      const avgRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : null;

      // Get Top 100 courses played count
      const { data: activity } = await supabase
        .from('user_course_activity' as any)
        .select('is_top100')
        .eq('user_id', userId);

      const top100Count = (activity || []).filter((a: any) => a.is_top100).length;

      return { avgRating, top100Count };
    },
    staleTime: 60_000,
  });

  // Mock data for now - would come from real queries
  const uniqueClubsPlayed = Math.max(1, Math.floor(totalCoursesPlayed * 0.7));
  const newCoursesThisYear = Math.min(totalCoursesPlayed, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <ScrollToTopGlass />

      {/* Phase 1: Journey Hero */}
      <JourneyHero
        coursesPlayed={totalCoursesPlayed}
        uniqueClubs={uniqueClubsPlayed}
        newCoursesThisYear={newCoursesThisYear}
        isOwnProfile={isOwnProfile}
        onAddCourse={() => setShowAddModal(true)}
      />

      {/* Phase 7: Course DNA Summary */}
      {totalCoursesPlayed > 0 && (
        <CourseDNA
          countriesPlayed={countriesPlayed}
          avgRating={statsData?.avgRating || null}
          top100Count={statsData?.top100Count || 0}
          totalCourses={totalCoursesPlayed}
        />
      )}

      {/* Phase 2: Favourites Showcase */}
      <FavouritesShowcase userId={userId} isOwnProfile={isOwnProfile} />

      {/* Phase 3-5: All Courses with tiered cards, filters, infinite scroll */}
      <AllCoursesList userId={userId} isOwnProfile={isOwnProfile} />

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