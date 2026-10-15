import React, { useMemo, useState } from 'react';
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
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useTop100Distribution } from '@/hooks/gam/useTop100Distribution';
import { useGamRecordConfig } from '@/hooks/gam/useGamRecordConfig';
import { top100Standing } from './handicap/whs/gam/trophy-room/career/shareModel';
import { CoursesMapSection, type MapPoint } from './courses/CoursesMapSection';
import { TheChaseSection } from './courses/TheChaseSection';
import { YourSignatureSection } from './courses/YourSignatureSection';
import type { ProfileRatingRow } from './courses/AllCoursesList';
import type { QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  const { totalCoursesPlayed, countriesPlayed, countryTallies, coursePoints, unmappedCount, isLoading } = useUserCourseSummary(userId);
  const { data: userActivity } = useUserCourseActivity(userId);
  const { data: distribution } = useTop100Distribution();
  const { data: recordConfig } = useGamRecordConfig();

  // One count, two consumers. The record tile and the filter chip must never disagree. This is distinct courses in ANY Top 100 list, which is NOT total_played_top100 (that is the global list alone).
  const top100Ids = useMemo(
    () => (userActivity ? new Set(userActivity.filter((a) => a.is_top100).map((a) => a.course_id)) : null),
    [userActivity],
  );
  const top100Count = top100Ids ? top100Ids.size : null;

  const mapPoints = useMemo<MapPoint[]>(
    () => (coursePoints ?? []).map((p) => ({ ...p, isTop100: !!top100Ids?.has(p.id) })),
    [coursePoints, top100Ids],
  );

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
  const { user: viewer } = useSupabaseSession();
  const [activeCountry, setActiveCountry] = useState<QuickRegion>('global');
  // 'row' has no Top 100 list of its own, so The Chase shows no next-target card there.
  const chaseListSlug = activeCountry === 'row' ? null : activeCountry;

  // ONE course_ratings select for this member, read by both the course list
  // and Your Signature. Do not add a second fetch.
  const { data: ratingRows } = useQuery({
    queryKey: ['profile-course-rating-rows', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRatingRow[]> => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('id, course_id, rating, review, design_score, condition_score, clubhouse_score, facilities_score, review_date, created_at')
        .eq('user_id', userId)
        .eq('is_mock', false);
      if (error) throw error;
      return (data ?? []) as ProfileRatingRow[];
    },
    staleTime: 60_000,
  });

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

  // World Top 100 standing - the GLOBAL list's count only, matched to the
  // trophy-room caller's floor/crossover/minDenominator. Never quoted against
  // the all-lists tile figure.
  const globalPlayed = top100Progress?.total_played_top100 ?? null;
  let standingLine: string | null = null;
  if (isOwnProfile && globalPlayed != null && distribution && recordConfig) {
    const st = top100Standing(
      distribution, 'global', globalPlayed,
      recordConfig.top100ShareFloor, recordConfig.top100RankCrossover, recordConfig.shareMinDenominator,
    );
    if (st.kind === 'share') {
      standingLine = `You have played ${globalPlayed} of the World Top 100 — more than ${st.pct}% of clbhouz members.`;
    } else if (st.kind === 'ordinal') {
      standingLine = `You have played ${globalPlayed} of the World Top 100 — among the top ${st.members} of any member.`;
    }
  }

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
        avgRating={avgRating ?? null}
        ratedCount={ratingSummary?.n ?? null}
        top100Played={top100Count}
        standing={standingLine}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />

      {countryTallies && (
        <div className="mt-6">
          <CoursesMapSection tallies={countryTallies} points={mapPoints} unmapped={unmappedCount} />
        </div>
      )}

      <div className="mt-6">
        <TheChaseSection userId={userId} viewerId={viewer?.id} distinctTop100={top100Count} listSlug={chaseListSlug} />
      </div>
      <div className="mt-6">
        <YourSignatureSection rows={ratingRows ?? []} />
      </div>

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
          top100Count={top100Count ?? undefined}
          ratingRows={ratingRows}
          activeCountry={activeCountry}
          onCountryChange={setActiveCountry}
        />
      </div>
    </div>
  );
};
