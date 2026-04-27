import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TieredCourseCard, CourseCardData } from './TieredCourseCard';
import { StickyFilterBar, CoursePrimaryTab, CourseSortOption } from './StickyFilterBar';
import { type QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { Button } from '@/components/ui/button';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';
import DossierCard from './DossierCard';
import BreakdownsPrompt from './BreakdownsPrompt';
import BreakdownsPickerSheet from './BreakdownsPickerSheet';
import MyRatingsTierDivider from './my-ratings/MyRatingsTierDivider';
import {
  getBucket,
  getBucketLabel,
  type MyRatingsBucket,
  type RatedCourseData,
} from './my-ratings/myRatingsHeroTiers';

interface AllCoursesListProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

const PAGE_SIZE = 20;

/**
 * Maps a hydrated CourseCardData row → the RatedCourseData shape consumed
 * by the new stratified My Ratings cards. Only safe to call when the row
 * has a non-null rating_value.
 */
const toRatedCourseData = (
  course: CourseCardData & {
    global_rank?: number | null;
    review_text?: string | null;
  },
): RatedCourseData => ({
  id: course.id,
  name: course.name,
  country: course.country,
  sub_country: course.sub_country,
  thumbnail_image: course.thumbnail_image,
  is_top100: course.is_top100,
  global_rank: course.global_rank ?? null,
  last_played_at: course.last_played_at,
  rating_value: course.rating_value as number,
  rating_id: course.rating_id,
  design_score: course.design_score ?? null,
  condition_score: course.condition_score ?? null,
  clubhouse_score: course.clubhouse_score ?? null,
  facilities_score: course.facilities_score ?? null,
  review: course.review_text ?? null,
  review_date: course.review_date ?? null,
});

export const AllCoursesList: React.FC<AllCoursesListProps> = ({ 
  userId,
  isOwnProfile,
  displayName,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<CoursePrimaryTab>('all');
  const [activeSort, setActiveSort] = useState<CourseSortOption>('rating-high-low');
  const [activeCountry, setActiveCountry] = useState<QuickRegion>('global');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBreakdownsPicker, setShowBreakdownsPicker] = useState(false);

  const handleCourseClick = useCallback(
    (courseId: string, ratingId: string | null) => {
      if (ratingId) {
        navigate(`/courses/${courseId}?tab=reviews&review=${ratingId}`);
      } else {
        navigate(`/courses/${courseId}`);
      }
    },
    [navigate],
  );

  const handleFullReview = useCallback(
    (courseId: string, ratingId: string | null) => {
      if (ratingId) {
        navigate(`/courses/${courseId}?tab=reviews&review=${ratingId}`);
      } else {
        navigate(`/courses/${courseId}?tab=reviews`);
      }
    },
    [navigate],
  );

  const { data: userActivity = [] } = useUserCourseActivity(userId);

  // Fetch course details
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-full', userId],
    enabled: !!userId && userActivity.length > 0,
    queryFn: async () => {
      const courseIds = userActivity.map(a => a.course_id);

      // Extra in-place fetch (per implementation brief): pull breakdown
      // scores + review_date so the own-rating comparator has full inputs.
      // Kept local to this component — useUserCourseActivity is intentionally
      // NOT modified so other consumers are unaffected.
      const [coursesResult, ratingsResult] = await Promise.all([
        supabase
          .from('golf_courses')
          .select('id, name, country, sub_country, thumbnail_image, global_rank')
          .in('id', courseIds),
        supabase
          .from('course_ratings')
          .select('id, course_id, rating, review, design_score, condition_score, clubhouse_score, facilities_score, review_date, created_at')
          .eq('user_id', userId)
          .eq('is_mock', false)
          .in('course_id', courseIds),
      ]);

      if (coursesResult.error) throw coursesResult.error;

      const ratingIdMap = new Map<string, string>();
      const ratingDetailsMap = new Map<string, {
        design_score: number | null;
        condition_score: number | null;
        clubhouse_score: number | null;
        facilities_score: number | null;
        review_date: string | null;
        review: string | null;
        rating: number | null;
      }>();
      (ratingsResult.data || []).forEach(r => {
        ratingIdMap.set(r.course_id, r.id);
        ratingDetailsMap.set(r.course_id, {
          design_score: r.design_score,
          condition_score: r.condition_score,
          clubhouse_score: r.clubhouse_score,
          facilities_score: r.facilities_score,
          review_date: r.review_date ?? r.created_at ?? null,
          review: r.review ?? null,
          rating: r.rating ?? null,
        });
      });

      return (coursesResult.data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        const details = ratingDetailsMap.get(course.id);
        return {
          ...course,
          is_top100: activity?.is_top100 || false,
          last_played_at: activity?.last_played_at || null,
          rating_value: activity?.rating_value || null,
          has_rating: activity?.has_rating || false,
          rating_id: ratingIdMap.get(course.id) || null,
          design_score: details?.design_score ?? null,
          condition_score: details?.condition_score ?? null,
          clubhouse_score: details?.clubhouse_score ?? null,
          facilities_score: details?.facilities_score ?? null,
          review_date: details?.review_date ?? null,
          review_text: details?.review ?? null,
        } as CourseCardData & { global_rank?: number | null; review_text?: string | null };
      });
    },
    staleTime: 60_000,
  });

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: courses.length,
    top100: courses.filter(c => c.is_top100).length,
  }), [courses]);

  // Courses missing breakdown ratings (page-level prompt eligibility).
  const missingBreakdownsCourses = useMemo<RatedCourseData[]>(
    () =>
      courses
        .filter(
          (c) =>
            c.has_rating &&
            c.rating_value != null &&
            (c.design_score == null ||
              c.condition_score == null ||
              c.clubhouse_score == null ||
              c.facilities_score == null),
        )
        .map((c) => toRatedCourseData(c as any)),
    [courses],
  );

  const handleBreakdownsPromptTap = useCallback(() => {
    if (missingBreakdownsCourses.length === 1) {
      navigate(`/courses/${missingBreakdownsCourses[0].id}/rate`);
    } else if (missingBreakdownsCourses.length >= 2) {
      setShowBreakdownsPicker(true);
    }
  }, [missingBreakdownsCourses, navigate]);

  // Apply filters and sorting
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Step 1: Primary tab filter
    if (activeTab === 'top100') {
      result = result.filter(c => c.is_top100);
    }

    // Step 2: Country filter
    if (activeCountry !== 'global') {
      result = result.filter(c => {
        switch (activeCountry) {
          case 'gb-i':
            return c.country === 'Britain & Ireland';
          case 'usa':
            return c.country === 'USA';
          case 'europe':
            return c.country === 'Continental Europe';
          case 'row':
            return !['Britain & Ireland', 'USA', 'Continental Europe'].includes(c.country || '');
          default:
            return true;
        }
      });
    }

    // Step 3: Sort
    const buildOwnRow = (c: any) => ({
      course_id: c.id,
      course_name: c.name,
      rating: c.rating_value,
      design_score: c.design_score,
      condition_score: c.condition_score,
      clubhouse_score: c.clubhouse_score,
      facilities_score: c.facilities_score,
      review_date: c.review_date,
    });

    switch (activeSort) {
      case 'recently-played':
        result.sort((a, b) => {
          const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
          const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'rating-high-low':
        result.sort((a, b) => compareOwnRatings(buildOwnRow(a), buildOwnRow(b), 'desc'));
        break;
      case 'rating-low-high':
        result.sort((a, b) => compareOwnRatings(buildOwnRow(a), buildOwnRow(b), 'asc'));
        break;
    }

    return result;
  }, [courses, activeTab, activeCountry, activeSort]);

  const tieAnnotated = filteredCourses;

  const displayedCourses = tieAnnotated.slice(0, displayCount);
  const hasMore = displayCount < tieAnnotated.length;
  const remainingCount = Math.min(PAGE_SIZE, tieAnnotated.length - displayCount);
  const totalFiltered = tieAnnotated.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, tieAnnotated.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, tieAnnotated.length]);

  const firstName = displayName?.split(' ')[0];

  const getEmptyMessage = () => {
    const subject = isOwnProfile ? "You haven't" : `${firstName || 'They'} hasn't`;
    if (activeTab === 'top100') {
      return `${subject} played any Top 100 courses yet.`;
    }
    if (activeCountry !== 'global') {
      return 'No courses found for the selected country.';
    }
    return `${subject} logged any courses yet.`;
  };

  if (isLoading) {
    return (
      <div ref={sectionRef} className="py-4">
        <div className="h-5 w-32 bg-muted rounded mb-1 animate-pulse" />
        <div className="h-3 w-48 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const ownerSubtitle = isOwnProfile ? 'Your full course history' : `${firstName || "Their"}\u2019s full course history`;

  return (
    <div ref={sectionRef} className="py-4">
      {/* Section header */}
      <div className="mb-3">
        <h2 className="text-[17px] font-semibold text-foreground">
          Course History
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {ownerSubtitle}
        </p>
      </div>

      {/* Filter bar */}
      <StickyFilterBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'top100' && activeCountry === 'global') {
            setActiveCountry('gb-i');
          }
          setDisplayCount(PAGE_SIZE);
        }}
        activeSort={activeSort}
        onSortChange={(sort) => {
          setActiveSort(sort);
          setDisplayCount(PAGE_SIZE);
        }}
        activeCountry={activeCountry}
        onCountryChange={(country) => {
          setActiveCountry(country);
          setDisplayCount(PAGE_SIZE);
        }}
        allCount={tabCounts.all}
        top100Count={tabCounts.top100}
      />

      {/* Page-level breakdowns prompt (own profile only) */}
      {isOwnProfile && missingBreakdownsCourses.length > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <BreakdownsPrompt
            missingCount={missingBreakdownsCourses.length}
            onTap={handleBreakdownsPromptTap}
          />
        </div>
      )}

      {/* Course list */}
      {tieAnnotated.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] mt-3">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {activeTab === 'top100' ? 'No Top 100 Courses Yet' : 'No Courses Found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {getEmptyMessage()}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/courses')}
                className="px-5 py-2.5 bg-card text-foreground border border-border/60 text-sm font-semibold rounded-full hover:bg-muted transition-colors min-h-[44px] active:scale-[0.97]"
              >
                Log a Course
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {(() => {
            const isHighLow = activeSort === 'rating-high-low';
            const isLowHigh = activeSort === 'rating-low-high';
            const isRatingSort = isHighLow || isLowHigh;

            // ── Rating-sorted: single primitive with tier dividers ─────
            if (isRatingSort) {
              const tierCounts: Record<MyRatingsBucket, number> = {
                top: 0,
                rest: 0,
              };
              tieAnnotated.forEach((c) => {
                if (c.has_rating && c.rating_value != null) {
                  tierCounts[getBucket(c.rating_value)]++;
                }
              });

              const elements: React.ReactNode[] = [];
              let currentBucket: MyRatingsBucket | null = null;
              let firstDividerRendered = false;

              displayedCourses.forEach((course, index) => {
                const rank = index + 1;
                const isRated = course.has_rating && course.rating_value != null;
                if (!isRated) return;

                const rating = course.rating_value as number;
                const bucket = getBucket(rating);

                if (bucket !== currentBucket) {
                  elements.push(
                    <MyRatingsTierDivider
                      key={`divider-${bucket}`}
                      tierName={getBucketLabel(bucket)}
                      count={tierCounts[bucket]}
                      isFirst={!firstDividerRendered}
                    />,
                  );
                  firstDividerRendered = true;
                  currentBucket = bucket;
                }

                elements.push(
                  <DossierCard
                    key={course.id}
                    course={toRatedCourseData(course as any)}
                    rank={rank}
                    onCourseClick={handleCourseClick}
                    onFullReview={handleFullReview}
                  />,
                );
              });

              return elements;
            }

            // ── Recently-played: flat list, no dividers ────────────
            return (
              <>
                {displayedCourses.map((course, index) => {
                  const rank = index + 1;
                  const isRated = course.has_rating && course.rating_value != null;
                  if (isRated) {
                    return (
                      <DossierCard
                        key={course.id}
                        course={toRatedCourseData(course as any)}
                        rank={rank}
                        onCourseClick={handleCourseClick}
                        onFullReview={handleFullReview}
                      />
                    );
                  }
                  return (
                    <div
                      key={course.id}
                      className="mb-2"
                      style={{ padding: '0 16px' }}
                    >
                      <TieredCourseCard
                        course={course}
                        isOwnProfile={isOwnProfile}
                      />
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-4 px-4 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full max-w-xs gap-1.5 transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Loading next courses…
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Next {remainingCount} courses
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Showing 1–{displayedCourses.length} of {totalFiltered.toLocaleString()} courses
          </p>
        </div>
      )}

      {!hasMore && tieAnnotated.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
          {isOwnProfile ? "You\u2019ve reached the end" : "End of list"} • {totalFiltered.toLocaleString()} courses total
        </p>
      )}

      {!hasMore && tieAnnotated.length > 0 && tieAnnotated.length <= PAGE_SIZE && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-foreground font-medium italic">
            {isOwnProfile 
              ? "That\u2019s your journey so far. On to the next tee."
              : `That\u2019s ${firstName || 'their'}\u2019s journey so far.`}
          </p>
        </div>
      )}
    </div>
  );
};
