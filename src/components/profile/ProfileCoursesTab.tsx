import React, { useMemo } from 'react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { JourneySummaryCard } from './courses/JourneySummaryCard';
import { WantToPlaySection } from './courses/WantToPlaySection';
import { AllCoursesList } from './courses/AllCoursesList';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';

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

  // PAGE-LEVEL scoring source. The RPC resolves auth.uid() server-side, so it
  // is own-profile only - rows never re-subscribe per card.
  const { data: analyticsCourses } = useUserAnalyticsCourses({ enabled: isOwnProfile });
  const scoringByCourseId = useMemo(() => {
    const m = new Map<string, UserAnalyticsCourse>();
    if (!isOwnProfile) return m;
    for (const row of analyticsCourses ?? []) {
      if (row?.course_id) m.set(row.course_id, row);
    }
    return m;
  }, [isOwnProfile, analyticsCourses]);

  const { data: top100Progress } = useTop100ProgressForUser(userId);

  /**
   * THE RATING FIGURE AND WHAT IT AVERAGES OVER.
   *
   * The mean of this member's own `course_ratings` rows, mock rows excluded and
   * zero ratings excluded. The COUNT travels with the mean because the strip's
   * label had to shorten to "RATING" to fit its column, and "RATING 8.4" alone
   * reads as one course's rating rather than the mean of however many. The basis
   * line beneath the strip names the count; without it the figure is ambiguous.
   *
   * It is NOT the 49 played courses and NOT the 35 with imported rounds - a
   * member can play a course without rating it. Three populations, three
   * definitions, all three now stated where they render.
   */
  const { data: ratingSummary } = useQuery({
    queryKey: ['user-avg-rating', userId],
    enabled: !!userId,
    queryFn: async (): Promise<{ avg: number; n: number } | null> => {
      const { data: ratings, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('is_mock', false)
        .gt('rating', 0);

      if (error) throw error;
      if (!ratings || ratings.length === 0) return null;
      return {
        avg: ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length,
        n: ratings.length,
      };
    },
    staleTime: 60_000,
  });
  const avgRating = ratingSummary?.avg ?? null;

  if (isLoading) {
    return (
      <div className="pb-2">
        {/* Journey summary skeleton */}
        <div className="px-5 pt-6 pb-5 space-y-3">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-12 w-24 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
        {/* Course history skeleton */}
        <div className="mt-6 px-4 space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded" />
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
        ratedCount={ratingSummary?.n ?? null}
        top100Played={top100Progress?.total_played_top100 ?? null}
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
          scoringByCourseId={scoringByCourseId}
        />
      </div>
    </div>
  );
};
