import React, { useState } from 'react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { JourneySummaryCard } from './courses/JourneySummaryCard';
import { FavouritesCarousel } from './courses/FavouritesCarousel';
import { WantToPlaySection } from './courses/WantToPlaySection';
import { AllCoursesList } from './courses/AllCoursesList';
import { AddCourseModal } from './courses/AddCourseModal';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCoursesTabProps {
  userId: string;
  isOwnProfile: boolean;
}

/**
 * ProfileCoursesTab - A personal golf legacy surface
 * 
 * Section order (MANDATORY):
 * 1. Journey Summary Card (merged stats)
 * 2. Favourite Courses (crown jewel carousel)
 * 3. Want to Play (planning + social)
 * 4. All Courses Played (refined history)
 */
export const ProfileCoursesTab: React.FC<ProfileCoursesTabProps> = ({
  userId,
  isOwnProfile,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { totalCoursesPlayed, countriesPlayed, isLoading } = useUserCourseSummary(userId);

  // Fetch average rating for the summary card
  const { data: avgRating } = useQuery({
    queryKey: ['user-avg-rating', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('is_mock', false);

      if (!ratings || ratings.length === 0) return null;
      return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-8">
      <ScrollToTopGlass />

      {/* Section 1: Journey Summary Card */}
      <JourneySummaryCard
        coursesPlayed={totalCoursesPlayed}
        countriesPlayed={countriesPlayed}
        avgRating={avgRating || null}
        isOwnProfile={isOwnProfile}
      />

      {/* Section 2: Favourite Courses Carousel (Crown Jewel) */}
      <FavouritesCarousel 
        userId={userId} 
        isOwnProfile={isOwnProfile}
        onManage={() => setShowAddModal(true)}
      />

      {/* Section 3: Want to Play */}
      <WantToPlaySection 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
      />

      {/* Section 4: All Courses Played */}
      <AllCoursesList 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
      />

      {/* Add Course Modal (for managing favourites) */}
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