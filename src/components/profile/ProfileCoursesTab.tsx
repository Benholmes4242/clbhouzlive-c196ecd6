import React from 'react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { JourneySummaryCard } from './courses/JourneySummaryCard';
import { WantToPlaySection } from './courses/WantToPlaySection';
import { AllCoursesList } from './courses/AllCoursesList';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCoursesTabProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

/**
 * ProfileCoursesTab — personal Course Legacy surface.
 *
 * Section order:
 *   1. JourneySummaryCard — Course Legacy summary (serif numeral, dispatch eyebrow)
 *   2. WantToPlaySection — Bucket List (hidden when empty; editorial framing for 1–2)
 *   3. AllCoursesList — Course History with DossierCard primitives
 *
 * Spacing: each section gets `mt-6` after the first.
 *
 * Top 10 carousel lives on `ProfilePageV2.tsx`, not in this tab.
 */
export const ProfileCoursesTab: React.FC<ProfileCoursesTabProps> = ({
  userId,
  isOwnProfile,
  displayName,
}) => {
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
        .eq('is_mock', false)
        .gt('rating', 0);

      if (!ratings || ratings.length === 0) return null;
      return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="pb-2 animate-pulse">
        {/* Journey summary skeleton */}
        <div className="px-5 pt-6 pb-5 space-y-3">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-12 w-24 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
        {/* Course history skeleton */}
        <div className="mt-6 px-4 space-y-2">
          <div className="h-5 w-32 bg-muted rounded mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <ScrollToTopGlass />

      {/* Section 1: Course Legacy summary */}
      <JourneySummaryCard
        coursesPlayed={totalCoursesPlayed}
        countriesPlayed={countriesPlayed}
        avgRating={avgRating || null}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />

      {/* Section 2: Bucket List (hidden when empty) */}
      <div className="mt-6">
        <WantToPlaySection userId={userId} isOwnProfile={isOwnProfile} />
      </div>

      {/* Section 3: Course History */}
      <div className="mt-6">
        <AllCoursesList
          userId={userId}
          isOwnProfile={isOwnProfile}
          displayName={displayName}
        />
      </div>
    </div>
  );
};
