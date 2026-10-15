import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterBar, CoursePrimaryTab, CourseSortOption } from './FilterBar';
import { type QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { compareOwnRatings } from '@/lib/sortCoursesByRating';
import DossierCard from './DossierCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import BreakdownsPrompt from './BreakdownsPrompt';
import BreakdownsPickerSheet from './BreakdownsPickerSheet';
import { usePlayedUnratedCourses } from '@/hooks/usePlayedUnratedCourses';
import MyRatingsTierDivider from './my-ratings/MyRatingsTierDivider';
import MyRatingsYearDivider from './my-ratings/MyRatingsYearDivider';
import {
  getBucket,
  getBucketLabel,
  type MyRatingsBucket,
  type RatedCourseData,
} from './my-ratings/myRatingsTiers';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import './coursesArchive.css';
import { useCourseListRanks } from '@/lib/courses/listRank';

interface AllCoursesListProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
  /**
   * Own-profile scoring, keyed by course id. Sourced ONCE at page level from
   * useUserAnalyticsCourses (auth.uid() server-side) - never per row.
   */
  scoringByCourseId?: Map<string, UserAnalyticsCourse>;
  /** Lifted to ProfileCoursesTab so the record tile and this chip share one count. */
  top100Count?: number;
  /**
   * This member's course_ratings rows, selected ONCE in ProfileCoursesTab so
   * this list and YourSignatureSection read one result. Never refetched here.
   */
  ratingRows?: ProfileRatingRow[];
  /** Region filter, lifted so The Chase targets the list selected here. */
  activeCountry?: QuickRegion;
  onCountryChange?: (region: QuickRegion) => void;
}

export interface ProfileRatingRow {
  id: string;
  course_id: string;
  rating: number | null;
  review: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review_date: string | null;
  created_at: string | null;
}

export interface CourseCardData {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  is_top100: boolean;
  last_played_at: string | null;
  rating_value: number | null;
  has_rating: boolean;
  rating_id: string | null;
  // Optional own-rating breakdown fields used by the canonical sort comparator
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
  review_date?: string | null;
}

const PAGE_SIZE = 20;

/** The recency sort is the default: a profile is a record of play, not a rival Top 100. */
export const DEFAULT_COURSE_SORT: CourseSortOption = 'recently-played';

const isRatedRow = (c: CourseCardData) => c.has_rating && c.rating_value != null;

/** Calendar year a row is grouped under on the recency sort; null = undated. */
export const playedYear = (iso: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
};

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
  rating_value: (course.rating_value ?? 0) as number,
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
  scoringByCourseId,
  ratingRows,
  activeCountry: activeCountryProp,
  onCountryChange,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<CoursePrimaryTab>('all');
  const [activeSort, setActiveSort] = useState<CourseSortOption>(DEFAULT_COURSE_SORT);
  const [localCountry, setLocalCountry] = useState<QuickRegion>('global');
  const activeCountry = activeCountryProp ?? localCountry;
  const setActiveCountry = (r: QuickRegion) => {
    setLocalCountry(r);
    onCountryChange?.(r);
  };
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBreakdownsPicker, setShowBreakdownsPicker] = useState(false);
  const [showReviewPicker, setShowReviewPicker] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { courses: playedUnrated, count: reviewCount } = usePlayedUnratedCourses(userId);

  const scoringFor = useCallback(
    (courseId: string): UserAnalyticsCourse | null =>
      (isOwnProfile ? scoringByCourseId?.get(courseId) : null) ?? null,
    [isOwnProfile, scoringByCourseId],
  );

  const handleRowExpand = useCallback(
    (course: RatedCourseData, hasScoring: boolean) => {
      analyticsEvents.track('profile_course_row_expanded', {
        course_id: course.id,
        has_scoring: hasScoring,
        own_profile: isOwnProfile,
      });
    },
    [isOwnProfile],
  );

  const handleCourseClick = useCallback(
    (courseId: string) => {
      navigate(`/courses/${courseId}`);
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
  const { data: courseRows = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user-played-courses-full', userId, userActivity.length],
    enabled: !!userId && userActivity.length > 0,
    queryFn: async () => {
      const courseIds = userActivity.map(a => a.course_id);
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank')
        .in('id', courseIds);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Breakdown scores + review_date come from the lifted ratingRows (one
  // course_ratings select in ProfileCoursesTab), merged here.
  const courses = useMemo(() => {
    const ratingDetailsMap = new Map<string, ProfileRatingRow>();
    (ratingRows || []).forEach(r => ratingDetailsMap.set(r.course_id, r));
    return courseRows.map(course => {
      const activity = userActivity.find(a => a.course_id === course.id);
      const details = ratingDetailsMap.get(course.id);
      return {
        ...course,
        is_top100: activity?.is_top100 || false,
        last_played_at: activity?.last_played_at || null,
        rating_value: activity?.rating_value || null,
        has_rating: activity?.has_rating || false,
        rating_id: details?.id || null,
        design_score: details?.design_score ?? null,
        condition_score: details?.condition_score ?? null,
        clubhouse_score: details?.clubhouse_score ?? null,
        facilities_score: details?.facilities_score ?? null,
        review_date: details ? (details.review_date ?? details.created_at ?? null) : null,
        review_text: details?.review ?? null,
      } as CourseCardData & { global_rank?: number | null; review_text?: string | null };
    });
  }, [courseRows, ratingRows, userActivity]);

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
        .map((c) => toRatedCourseData(c)),
    [courses],
  );

  const handleBreakdownsPromptTap = useCallback(() => {
    if (missingBreakdownsCourses.length === 1) {
      navigate(`/courses/${missingBreakdownsCourses[0].id}/rate`);
    } else if (missingBreakdownsCourses.length >= 2) {
      setShowBreakdownsPicker(true);
    }
  }, [missingBreakdownsCourses, navigate]);

  const handleReviewPromptTap = useCallback(() => {
    if (reviewCount === 1) {
      navigate(`/courses/${playedUnrated[0].course_id}/rate`);
    } else if (reviewCount >= 2) {
      setShowReviewPicker(true);
    }
  }, [reviewCount, playedUnrated, navigate]);

  const promptMode: 'review' | 'breakdowns' | null =
    reviewCount > 0
      ? 'review'
      : missingBreakdownsCourses.length > 0
        ? 'breakdowns'
        : null;

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
    const buildOwnRow = (c: CourseCardData & { review_date?: string | null }) => ({
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
      case 'rating-low-high': {
        // Every played course is drawn. Rated rows sort by compareOwnRatings;
        // unrated rows all sit below them, most recently played first.
        const dir = activeSort === 'rating-high-low' ? 'desc' : 'asc';
        const playedAt = (c: { last_played_at?: string | null }) =>
          c.last_played_at ? new Date(c.last_played_at).getTime() : 0;
        result.sort((a, b) => {
          const ra = isRatedRow(a);
          const rb = isRatedRow(b);
          if (ra && rb) return compareOwnRatings(buildOwnRow(a), buildOwnRow(b), dir);
          if (ra !== rb) return ra ? -1 : 1;
          return playedAt(b) - playedAt(a);
        });
        break;
      }
    }

    return result;
  }, [courses, activeTab, activeCountry, activeSort]);

  const isRatingSort = activeSort === 'rating-high-low' || activeSort === 'rating-low-high';

  // ONE SET OF ROWS FEEDS THE CHIPS, THE LIST AND THE FOOTER. Every sort draws
  // every played course, so the counts are the rows drawn under the current
  // region filter - never from a wider source.
  const drawnFor = useCallback(
    (tab: CoursePrimaryTab) =>
      courses.filter((c) => {
        if (tab === 'top100' && !c.is_top100) return false;
        if (activeCountry === 'global') return true;
        switch (activeCountry) {
          case 'gb-i': return c.country === 'Britain & Ireland';
          case 'usa': return c.country === 'USA';
          case 'europe': return c.country === 'Continental Europe';
          case 'row': return !['Britain & Ireland', 'USA', 'Continental Europe'].includes(c.country || '');
          default: return true;
        }
      }).length,
    [courses, activeCountry],
  );
  const tabCounts = useMemo(
    () => ({ all: drawnFor('all'), top100: drawnFor('top100') }),
    [drawnFor],
  );

  const drawnCourses = filteredCourses;

  const displayedCourses = drawnCourses.slice(0, displayCount);
  // Every Top 100 placement for the drawn rows, folded into each row's first meta line.
  const { data: listRanks } = useCourseListRanks(displayedCourses.filter((c) => c.is_top100).map((c) => c.id));
  const hasMore = displayCount < drawnCourses.length;
  const totalFiltered = drawnCourses.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, drawnCourses.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, drawnCourses.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) loadMore();
        }
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

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
        <Skeleton variant="dark" className="h-5 w-32 rounded mb-1" />
        <Skeleton variant="dark" className="h-3 w-48 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="dark" className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div ref={sectionRef} className="px-4">
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <p className="text-sm text-muted-foreground">Couldn't load courses</p>
          <button
            onClick={() => refetch()}
            className="h-10 px-5 rounded-full text-sm font-semibold bg-foreground text-background active:scale-[0.97] transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="courses-archive pb-4" style={{ borderTop: `1px solid ${A.HAIRLINE}` }}>
      {/* Page-level prompt (own profile only): review first, then breakdowns */}
      {isOwnProfile && promptMode && (
        <div style={{ padding: '24px 20px 22px', borderBottom: `1px solid ${A.HAIRLINE}`, marginBottom: 24 }}>
          <BreakdownsPrompt
            variant={promptMode}
            missingCount={promptMode === 'review' ? reviewCount : missingBreakdownsCourses.length}
            courses={
              promptMode === 'review'
                ? playedUnrated.map((c) => ({
                    id: c.course_id,
                    name: c.name,
                    country: null,
                    sub_country: c.region,
                    thumbnail_image: c.thumbnail_image,
                    is_top100: false,
                    global_rank: null,
                    last_played_at: c.last_played,
                    rating_value: 0,
                    rating_id: null,
                    design_score: null,
                    condition_score: null,
                    clubhouse_score: null,
                    facilities_score: null,
                    review: null,
                    review_date: null,
                  }))
                : missingBreakdownsCourses
            }
            onTap={promptMode === 'review' ? handleReviewPromptTap : handleBreakdownsPromptTap}
          />
        </div>
      )}


      <div style={{ padding: promptMode && isOwnProfile ? '0 20px' : '24px 20px 0' }}>
        <SectionHeader className="archive-heading" tone="amber" kicker="THE ARCHIVE" title="Every course, newest first" />
      </div>

      {/* Filter bar */}
      <FilterBar
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
      {drawnCourses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/10 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] mt-3">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-muted border border-border/10 flex items-center justify-center mb-4">
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
                className="px-5 py-2.5 bg-card text-foreground border border-border/[0.06] text-sm font-semibold rounded-full hover:bg-muted transition-colors min-h-[44px] active:scale-[0.97]"
              >
                Log a Course
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {(() => {
            // ── Rating-sorted: single primitive with tier dividers ─────
            if (isRatingSort) {
              const tierCounts: Record<MyRatingsBucket, number> = {
                top: 0,
                rest: 0,
              };
              let unratedCount = 0;
              drawnCourses.forEach((c) => {
                if (isRatedRow(c)) tierCounts[getBucket(c.rating_value as number)]++;
                else unratedCount++;
              });
              let unratedDividerRendered = false;

              const elements: React.ReactNode[] = [];
              let currentBucket: MyRatingsBucket | null = null;
              let firstDividerRendered = false;

              displayedCourses.forEach((course) => {
                // A row's position in a sorted list is not a rank. The only rank on this row is global_rank, which comes from the published Top 100.
                if (!isRatedRow(course)) {
                  if (!unratedDividerRendered) {
                    elements.push(
                      <MyRatingsTierDivider
                        key="divider-unrated"
                        tierName="NOT YET RATED"
                        count={unratedCount}
                        isFirst={!firstDividerRendered}
                      />,
                    );
                    unratedDividerRendered = true;
                    firstDividerRendered = true;
                  }
                  elements.push(
                    <DossierCard
                      appearance="archive"
                      key={course.id}
                      course={toRatedCourseData(course)}
                      unrated
                      onRate={isOwnProfile ? (id) => navigate(`/courses/${id}/rate`) : undefined}
                      onCourseClick={handleCourseClick}
                      onFullReview={handleFullReview}
                  listRank={listRanks?.get(course.id) ?? null}
                  onEditReview={isOwnProfile ? (id) => navigate(`/courses/${id}/rate`) : undefined}
                  isFirst={(elements[elements.length - 1] as React.ReactElement | undefined)?.type !== DossierCard}
                      scoring={scoringFor(course.id)}
                      onExpand={handleRowExpand}
                    />,
                  );
                  return;
                }

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
                      appearance="archive"
                    key={course.id}
                    course={toRatedCourseData(course)}
                    onCourseClick={handleCourseClick}
                    onFullReview={handleFullReview}
                  listRank={listRanks?.get(course.id) ?? null}
                  onEditReview={isOwnProfile ? (id) => navigate(`/courses/${id}/rate`) : undefined}
                  isFirst={(elements[elements.length - 1] as React.ReactElement | undefined)?.type !== DossierCard}
                    scoring={scoringFor(course.id)}
                    onExpand={handleRowExpand}
                  />,
                );
              });

              return elements;
            }

            // ── Recently-played: one row design, a year divider per calendar year
            const yearCounts = new Map<number | null, number>();
            drawnCourses.forEach((c) => {
              const y = playedYear(c.last_played_at);
              yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
            });
            const yearCountries = new Map<number | null, Set<string>>();
            drawnCourses.forEach((c) => {
              const country = c.sub_country?.trim();
              if (!country) return;
              const y = playedYear(c.last_played_at);
              const countries = yearCountries.get(y) ?? new Set<string>();
              countries.add(country);
              yearCountries.set(y, countries);
            });
            const elements: React.ReactNode[] = [];
            let currentYear: number | null | undefined = undefined;
            displayedCourses.forEach((course) => {
              // A row's position in a sorted list is not a rank. The only rank on this row is global_rank, which comes from the published Top 100.
              const year = playedYear(course.last_played_at);
              if (year !== currentYear) {
                elements.push(
                  <MyRatingsYearDivider
                    key={`year-${year ?? 'undated'}`}
                    year={year}
                    count={yearCounts.get(year) ?? 0}
                    countryCount={yearCountries.get(year)?.size ?? 0}
                    isFirst={currentYear === undefined}
                  />,
                );
                currentYear = year;
              }
              const rated = isRatedRow(course);
              elements.push(
                <DossierCard
                      appearance="archive"
                  key={course.id}
                  course={toRatedCourseData(course)}
                  unrated={!rated}
                  onRate={isOwnProfile && !rated ? (id) => navigate(`/courses/${id}/rate`) : undefined}
                  onCourseClick={handleCourseClick}
                  onFullReview={handleFullReview}
                  listRank={listRanks?.get(course.id) ?? null}
                  onEditReview={isOwnProfile ? (id) => navigate(`/courses/${id}/rate`) : undefined}
                  isFirst={(elements[elements.length - 1] as React.ReactElement | undefined)?.type !== DossierCard}
                  scoring={scoringFor(course.id)}
                  onExpand={handleRowExpand}
                />,
              );
            });
            return elements;
          })()}
        </div>
      )}

      {/* Scoring provenance - stated once, at the foot of the list */}
      {isOwnProfile && (scoringByCourseId?.size ?? 0) > 0 && (
        <p style={{ ...LABEL, color: A.DIM, textAlign: 'center', padding: '14px 24px 0' }}>
          SCORING FROM YOUR IMPORTED ROUNDS
        </p>
      )}

      {/* Overflow affordance: reveals every remaining row at once. */}
      {hasMore && (
        <div style={{ padding: '0 20px' }}>
          <button
            type="button"
            data-testid="archive-show-all"
            onClick={() => setDisplayCount(drawnCourses.length)}
            style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: A.AMBER, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
          >
            {`Show all ${formatNumber(drawnCourses.length)} \u203A`}
          </button>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div
          ref={sentinelRef}
          style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}
          aria-hidden="true"
        >
          <div className="text-xs font-semibold text-muted-foreground">Loading more...</div>
        </div>
      )}

      {!hasMore && drawnCourses.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
          {isOwnProfile ? "You\u2019ve reached the end" : "End of list"} • {formatNumber(totalFiltered)} courses total
        </p>
      )}

      {!hasMore && drawnCourses.length > 0 && drawnCourses.length <= PAGE_SIZE && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-foreground font-medium italic">
            {isOwnProfile 
              ? "That\u2019s your journey so far. On to the next tee."
              : `That\u2019s ${firstName || 'their'}\u2019s journey so far.`}
          </p>
        </div>
      )}

      {isOwnProfile && (
        <BreakdownsPickerSheet
          isOpen={showBreakdownsPicker}
          onClose={() => setShowBreakdownsPicker(false)}
          missingCourses={missingBreakdownsCourses}
          onPickCourse={(courseId) => {
            setShowBreakdownsPicker(false);
            navigate(`/courses/${courseId}/rate`);
          }}
        />
      )}

      {isOwnProfile && (
        <BreakdownsPickerSheet
          isOpen={showReviewPicker}
          onClose={() => setShowReviewPicker(false)}
          mode="review"
          missingCourses={playedUnrated.map((c) => ({
            id: c.course_id,
            name: c.name,
            country: null,
            sub_country: null,
            thumbnail_image: c.thumbnail_image,
            is_top100: false,
            global_rank: null,
            last_played_at: c.last_played,
            rating_value: 0,
            rating_id: null,
            design_score: null,
            condition_score: null,
            clubhouse_score: null,
            facilities_score: null,
            review: null,
            review_date: null,
          }))}
          onPickCourse={(courseId) => {
            setShowReviewPicker(false);
            navigate(`/courses/${courseId}/rate`);
          }}
        />
      )}
    </div>
  );
};
