import React, { useState, useMemo } from 'react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { JourneySummaryCard } from './courses/JourneySummaryCard';

import { WantToPlaySection } from './courses/WantToPlaySection';
import { AllCoursesList } from './courses/AllCoursesList';
import { AddCourseModal } from './courses/AddCourseModal';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { TopTenActivityFeed } from './courses/TopTenActivityFeed';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCoursesTabProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

/**
 * ProfileCoursesTab - A personal golf legacy surface
 * 
 * Section order (MANDATORY):
 * 1. Journey Summary Card (merged stats)
 * 2. Top 10 Rated Courses (crown jewel carousel)
 * 3. Courses to Play (aspirational bucket list)
 * 4. All Courses Played (refined history)
 * 
 * Vertical Rhythm (per design brief):
 * - Journey → Top 10: 24-32px (generous transition from stats to prestige)
 * - Top 10 → Courses to Play: 20-24px (slightly tighter)
 * - Courses to Play → All Courses: 24px (medium reset)
 * - Section header → content: 12-16px
 */
export const ProfileCoursesTab: React.FC<ProfileCoursesTabProps> = ({
  userId,
  isOwnProfile,
  displayName,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { totalCoursesPlayed, countriesPlayed, isLoading } = useUserCourseSummary(userId);
  const { topTen } = useUserTopTenCourses(userId);

  // Stable list of existing top ten course IDs for the modal
  const existingTopTenCourseIds = useMemo(() => 
    topTen.map(c => c.course_id).sort(), 
    [topTen]
  );

  // Fetch average rating for the summary card
  const { data: avgRating } = useQuery({
    queryKey: ['user-avg-rating', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('is_mock', false)
        .gt('rating', 0); // Only count actual ratings, not placeholders

      if (!ratings || ratings.length === 0) return null;
      return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="pb-2 space-y-7 animate-pulse">
        {/* Journey summary skeleton */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-12 w-16 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="flex gap-8 mt-2">
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-8 w-20 bg-muted rounded" />
          </div>
        </div>
        {/* Top 10 carousel skeleton */}
        <div className="px-4 space-y-3">
          <div className="h-5 w-36 bg-muted rounded" />
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-[227px] h-[292px] bg-muted rounded-[22px]" />
            <div className="flex-shrink-0 w-[227px] h-[292px] bg-muted rounded-[22px]" />
          </div>
        </div>
        {/* Course list skeleton */}
        <div className="px-0 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl mx-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <ScrollToTopGlass />

      {/* Section 1: Course Legacy Summary Card */}
      <JourneySummaryCard
        coursesPlayed={totalCoursesPlayed}
        countriesPlayed={countriesPlayed}
        avgRating={avgRating || null}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />

      {/* Section 2: Personal Top 10 Carousel (Crown Jewel) */}
      {/* Generous 28px spacing from Legacy to Top 10 */}
      <div className="mt-7">
        <FavouritesCarousel 
          userId={userId} 
          isOwnProfile={isOwnProfile}
          onManage={() => setShowAddModal(true)}
          displayName={displayName}
        />
      </div>

      {/* Top 10 Activity Feed */}
      <div className="mt-4">
        <TopTenActivityFeed targetUserId={userId} />
      </div>

      {/* Section 3: Courses to Play (Aspirational) */}
      {/* Slightly tighter 20px spacing */}
      <div className="mt-5">
        <WantToPlaySection 
          userId={userId} 
          isOwnProfile={isOwnProfile} 
        />
      </div>

      {/* Section 4: Course History */}
      {/* Medium 24px spacing for context reset */}
      <div className="mt-6">
        <AllCoursesList 
          userId={userId} 
          isOwnProfile={isOwnProfile}
          displayName={displayName}
        />
      </div>

      {/* Add Course Modal (for managing favourites) */}
      {showAddModal && (
        <AddCourseModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          existingCourseIds={existingTopTenCourseIds}
        />
      )}
    </div>
  );
};
