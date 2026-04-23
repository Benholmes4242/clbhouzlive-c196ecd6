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
import EditRatingModal from '@/components/courses/EditRatingModal';
import MyRatingsHeroCard, {
  type RatedCourseData,
} from './my-ratings/MyRatingsHeroCard';
import MyRatingsCompactRow from './my-ratings/MyRatingsCompactRow';
import MyRatingsTierDivider from './my-ratings/MyRatingsTierDivider';
import {
  getHeroTier,
  getBucket,
  getBucketLabel,
  type MyRatingsBucket,
} from './my-ratings/myRatingsTiering';

interface AllCoursesListProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

const PAGE_SIZE = 20;

/**
 * Maps the local CourseCardData → MyRatingsCourseCardData expected by the
 * world-class card component. Only safe to call when course.has_rating is
 * truthy and rating_value is non-null.
 */
const toMyRatingsCardData = (course: CourseCardData): MyRatingsCourseCardData => ({
  id: course.rating_id ?? course.id,
  rating: course.rating_value ?? 0,
  review_date: course.review_date ?? course.last_played_at ?? new Date().toISOString(),
  design_score: course.design_score ?? null,
  condition_score: course.condition_score ?? null,
  clubhouse_score: course.clubhouse_score ?? null,
  facilities_score: course.facilities_score ?? null,
  golf_courses: {
    id: course.id,
    name: course.name,
    country: course.country,
    sub_country: course.sub_country,
    region: null,
    global_rank: course.is_top100 ? (course as unknown as { global_rank?: number }).global_rank ?? null : null,
    thumbnail_image: course.thumbnail_image,
  },
});

export const AllCoursesList: React.FC<AllCoursesListProps> = ({ 
  userId,
  isOwnProfile,
  displayName,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<CoursePrimaryTab>('all');
  const [activeSort, setActiveSort] = useState<CourseSortOption>('recently-played');
  const [activeCountry, setActiveCountry] = useState<QuickRegion>('global');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseCardData | null>(null);

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

  // Tie annotation: only meaningful when sorting by rating descending
  // (the brief's "why above" reveal compares to the next-lower card).
  const tieAnnotated = useMemo(() => {
    if (activeSort !== 'rating-high-low') return filteredCourses;
    // annotateTies needs MyRatingsCourseCardData-shaped rows. Build a parallel
    // map keyed by course id so we can hand the tiedAbove back onto the
    // CourseCardData rows without changing their type.
    const ratedShaped = filteredCourses
      .filter(c => c.has_rating && c.rating_value != null)
      .map(c => ({
        ...toMyRatingsCardData(c),
        __srcCourseId: c.id,
      }));
    const annotated = annotateTies(ratedShaped as any);
    const tieMap = new Map<string, any>();
    annotated.forEach((row: any) => {
      if (row.tiedAbove) tieMap.set(row.__srcCourseId, row.tiedAbove);
    });
    return filteredCourses.map(c => ({
      ...c,
      __tiedAbove: tieMap.get(c.id) ?? undefined,
    }));
  }, [filteredCourses, activeSort]);

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
        <div className="space-y-2 mt-3">
          {(() => {
            const isRatingSort =
              activeSort === 'rating-high-low' || activeSort === 'rating-low-high';

            // Helper: convert query row → tier card props shape.
            const toTierCourse = (course: typeof displayedCourses[number]): MyRatingsTierCourse => ({
              id: course.id,
              name: course.name,
              country: course.country,
              sub_country: course.sub_country,
              thumbnail_image: course.thumbnail_image,
              global_rank: course.is_top100
                ? (course as unknown as { global_rank?: number | null }).global_rank ?? null
                : null,
              rating_id: course.rating_id,
              rating_value: course.rating_value as number,
              review_date: course.review_date ?? course.last_played_at ?? null,
              review_text: (course as unknown as { review_text?: string | null }).review_text ?? null,
              design_score: course.design_score ?? null,
              condition_score: course.condition_score ?? null,
              clubhouse_score: course.clubhouse_score ?? null,
              facilities_score: course.facilities_score ?? null,
            });

            const renderTierCard = (
              course: typeof displayedCourses[number],
              rank: number,
              tier: MyRatingsCardTier,
            ) => {
              const props = {
                course: toTierCourse(course),
                rank,
                onClick: () =>
                  navigate(
                    course.rating_id
                      ? `/courses/${course.id}?tab=reviews&review=${course.rating_id}`
                      : `/courses/${course.id}`
                  ),
              };
              if (tier === 'tier1') return <MyRatingsTier1Card key={course.id} {...props} />;
              if (tier === 'tier2') return <MyRatingsTier2Card key={course.id} {...props} />;
              return <MyRatingsTier3Card key={course.id} {...props} />;
            };

            // ── Stratified rendering for rating-sorted lists ───────────────
            if (isRatingSort) {
              // Tier counts across the *entire* filtered+sorted list, not just
              // the page (so the divider count reflects total rounds in tier).
              const tierCounts: Record<MyRatingsCardTier, number> = {
                tier1: 0,
                tier2: 0,
                tier3: 0,
              };
              tieAnnotated.forEach((c) => {
                if (c.has_rating && c.rating_value != null) {
                  tierCounts[getCardTier(c.rating_value)]++;
                }
              });

              const elements: React.ReactNode[] = [];
              let currentTier: MyRatingsCardTier | null = null;
              let firstDividerRendered = false;

              displayedCourses.forEach((course, index) => {
                const rank = index + 1;
                const isRated = course.has_rating && course.rating_value != null;

                if (!isRated) {
                  // Edge case: an unrated course in a rating-sorted list.
                  // Surface via the legacy tiered card so it doesn't disappear.
                  elements.push(
                    <TieredCourseCard
                      key={course.id}
                      course={course}
                      isOwnProfile={isOwnProfile}
                    />
                  );
                  return;
                }

                const tier = getCardTier(course.rating_value as number);
                if (tier !== currentTier) {
                  elements.push(
                    <MyRatingsTierDivider
                      key={`divider-${tier}`}
                      tier={tier}
                      count={tierCounts[tier]}
                      isFirst={!firstDividerRendered}
                    />
                  );
                  firstDividerRendered = true;
                  currentTier = tier;
                }

                elements.push(renderTierCard(course, rank, tier));
              });

              return elements;
            }

            // ── Default rendering (recently-played etc.) ───────────────────
            return displayedCourses.map((course, index) => {
              const rank = index + 1;
              const isRated = course.has_rating && course.rating_value != null;
              if (isRated) {
                const cardData: MyRatingsCourseCardData = {
                  ...toMyRatingsCardData(course),
                  tiedAbove: (course as any).__tiedAbove,
                };
                return (
                  <MyRatingsCourseCard
                    key={course.id}
                    course={cardData}
                    rank={rank}
                    onCourseClick={(id) => navigate(`/courses/${id}`)}
                    onAddBreakdown={() => setEditingCourse(course)}
                  />
                );
              }
              return (
                <TieredCourseCard
                  key={course.id}
                  course={course}
                  isOwnProfile={isOwnProfile}
                />
              );
            });
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

      {editingCourse && editingCourse.has_rating && editingCourse.rating_value != null && (
        <EditRatingModal
          courseId={editingCourse.id}
          courseName={editingCourse.name}
          currentRating={editingCourse.rating_value}
          currentReview={(editingCourse as any).review_text ?? null}
          currentDesignScore={editingCourse.design_score ?? null}
          currentConditionScore={editingCourse.condition_score ?? null}
          currentClubhouseScore={editingCourse.clubhouse_score ?? null}
          currentFacilitiesScore={editingCourse.facilities_score ?? null}
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </div>
  );
};
