import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useFriendsTop100Progress } from '@/hooks/useFriendsTop100Progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import GolfClubView from '@/components/golf-club/GolfClubView';
import {
  Top100ListLeaderboard,
  Top100ListMilestoneRail,
  Top100ListFilterChips,
  Top100ListCourseCard,
  Top100ListProgressCard,
  JourneyInsightCard,
  generateJourneyInsights,
  type Top100FilterChip,
} from '@/components/top100/list';
import type { Top100SortMode } from '@/components/top100/list/Top100ListFilterChips';
import { Top100HeroShell } from '@/components/top100/Top100HeroShell';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';
import { EXPLORE_PAGE_SIZE } from '@/config/pagination';
import { scrollToTop } from '@/utils/scrollToTop';

const REGION_DISPLAY_NAMES: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'Great Britain & Ireland',
  usa: 'USA',
  europe: 'Continental Europe',
};

const PAGE_SIZE = EXPLORE_PAGE_SIZE; // Match Explore page (10 courses)
const INSIGHT_INTERVAL = 10; // Insert insight card every N courses

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, user } = useSupabaseSession();

  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(user?.id);
  const { data: userActivity } = useUserCourseActivity(user?.id);


  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [filterChip, setFilterChip] = useState<Top100FilterChip>('official');
  const [sortMode, setSortMode] = useState<Top100SortMode>('rank');
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top on mount / slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  // Restore displayedCount + scroll from sessionStorage on mount
  useEffect(() => {
    const savedCount = sessionStorage.getItem('top100:list:displayedCount');
    const savedScrollY = sessionStorage.getItem('top100:list:scrollY');

    if (savedCount) {
      setDisplayedCount(Number(savedCount));
    }
    if (savedScrollY) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: Number(savedScrollY),
          left: 0,
          behavior: 'auto',
        });
      });
    }

    sessionStorage.removeItem('top100:list:displayedCount');
    sessionStorage.removeItem('top100:list:scrollY');
  }, []);

  // Sticky filter detection
  useEffect(() => {
    const handleScroll = () => {
      if (filterRef.current) {
        const rect = filterRef.current.getBoundingClientRect();
        setIsFilterSticky(rect.top <= 0);
      }
    };

    const scrollContainer = document.getElementById('root');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  // Find the current list
  const currentList = lists?.find((l) => l.slug === slug);

  // Fetch courses for this list
  const { data: courses, isLoading } = useQuery({
    queryKey: ['top100-list-courses', currentList?.id],
    enabled: !!currentList?.id,
    queryFn: async () => {
      if (!currentList?.id) return [];

      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select(`
          rank,
          course_id,
          golf_courses!inner (
            id,
            name,
            country,
            sub_country,
            region,
            thumbnail_image,
            continent,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('list_id', currentList.id)
        .order('rank', { ascending: true });

      if (error) throw error;

      const courseIds = (data || []).map((item: any) => item.golf_courses.id);
      
      // Fetch ratings aggregates
      const { data: ratingsData } = await supabase
        .from('course_rating_aggregates')
        .select('course_id, avg_overall_score, rating_count')
        .in('course_id', courseIds);

      const ratingsMap = new Map(
        (ratingsData || []).map((r: any) => [r.course_id, { 
          avgRating: r.avg_overall_score, 
          reviewCount: r.rating_count || 0 
        }])
      );

      return (data || []).map((item: any) => {
        const ratingInfo = ratingsMap.get(item.golf_courses.id);
        return {
          ...item.golf_courses,
          rank: item.rank,
          communityRating: ratingInfo?.avgRating || null,
          reviewCount: ratingInfo?.reviewCount || 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Check if we have review data
  const hasReviewData = useMemo(() => {
    return courses?.some((c) => c.reviewCount > 0) ?? false;
  }, [courses]);

  // Fetch friends progress on this list
  const { data: friendsProgress = [] } = useFriendsTop100Progress(user?.id, currentList?.id);

  // Get user's played courses
  const playedCourseIds = useMemo(() => {
    return new Set((userActivity || []).map((a) => a.course_id));
  }, [userActivity]);

  // Get list progress
  const listProgress = progressData?.lists?.find((p) => p.listId === currentList?.id);
  const playedCount = listProgress?.played || 0;
  const totalCount = listProgress?.total || courses?.length || 100;

  // Build hero course for region card
  const heroCourse = courses?.[0];

  // Build list summary for the region card
  const listSummary: Top100ListSummary | null = useMemo(() => {
    if (!currentList) return null;
    return {
      id: currentList.id,
      slug: currentList.slug,
      name: currentList.name,
      short_label: currentList.short_label,
      total_courses: totalCount,
      played_count: playedCount,
      hero_course: heroCourse ? {
        id: heroCourse.id,
        name: heroCourse.name,
        country: heroCourse.country,
        region: heroCourse.region,
        cover_image_url: heroCourse.thumbnail_image,
        rank_in_list: heroCourse.rank,
      } : null,
    };
  }, [currentList, totalCount, playedCount, heroCourse]);

  const listDisplayName = REGION_DISPLAY_NAMES[slug || 'global'] || 'Worldwide';

  // Build friends list for leaderboard
  const friendsSummary = useMemo(() => {
    return friendsProgress.map((f) => ({
      id: f.user_id,
      name: f.profile.display_name || f.profile.username || 'Unknown',
      username: f.profile.username || '',
      avatarUrl: f.profile.profile_photo_url,
      playedOnList: f.courses_played_in_list,
    }));
  }, [friendsProgress]);

  // Generate journey insights
  const journeyInsights = useMemo(() => {
    if (!courses) return [];
    const playedCourses = courses
      .filter(c => playedCourseIds.has(c.id))
      .map(c => ({ id: c.id, country: c.country, rank: c.rank }));
    return generateJourneyInsights(playedCourses, totalCount, slug);
  }, [courses, playedCourseIds, totalCount, slug]);



  // Reset displayed count when filter or sort changes
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [filterChip, sortMode]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = [...courses];

    // Step 1: Apply filter based on chip
    if (filterChip === 'unplayed') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    } else if (filterChip === 'played') {
      filtered = filtered.filter((c) => playedCourseIds.has(c.id));
    }
    // 'official' and 'community' don't filter, only affect default sort meaning

    // Step 2: Apply sort
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'rank':
          // Rank meaning depends on filter
          if (filterChip === 'community') {
            // Sort by community rating descending
            return (b.communityRating || 0) - (a.communityRating || 0);
          }
          // Official, Played, Unplayed → use official rank
          return a.rank - b.rank;

        case 'az':
          return a.name.localeCompare(b.name);

        case 'za':
          return b.name.localeCompare(a.name);

        case 'most_reviewed':
          // Primary: review count desc, Tie-breaker: rank asc
          if (b.reviewCount !== a.reviewCount) {
            return b.reviewCount - a.reviewCount;
          }
          return a.rank - b.rank;

        case 'highest_rated':
          // Primary: avg rating desc, Tie-breaker: review count desc, then rank
          const ratingA = a.communityRating || 0;
          const ratingB = b.communityRating || 0;
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          if (b.reviewCount !== a.reviewCount) {
            return b.reviewCount - a.reviewCount;
          }
          return a.rank - b.rank;

        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, filterChip, sortMode, playedCourseIds]);

  // Load-more calculations (Explore pattern: accumulate items)
  const totalFiltered = filteredAndSortedCourses.length;
  const hasMoreCourses = displayedCount < totalFiltered;
  const remainingCount = Math.min(PAGE_SIZE, totalFiltered - displayedCount);

  // Displayed courses (load-more pattern: show 1 to displayedCount)
  const displayedCourses = useMemo(() => {
    return filteredAndSortedCourses.slice(0, displayedCount);
  }, [filteredAndSortedCourses, displayedCount]);

  // Load more function (matches Explore pattern)
  const loadMore = useCallback(() => {
    if (!hasMoreCourses || isLoadingMore) return;
    
    setIsLoadingMore(true);
    // Simulate brief loading state for UX consistency
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, totalFiltered));
      setIsLoadingMore(false);
    }, 150);
  }, [hasMoreCourses, isLoadingMore, totalFiltered]);

  // Save displayedCount + scroll before navigating to course detail
  const handleOpenCourse = useCallback((courseId: string) => {
    sessionStorage.setItem('top100:list:displayedCount', String(displayedCount));
    sessionStorage.setItem('top100:list:scrollY', String(window.scrollY));
    navigate(`/courses/${courseId}`);
  }, [displayedCount, navigate]);

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background compact-header-offset">
        <main className="pb-20">
          <div className="animate-pulse space-y-4 pt-4">
            <div className="h-[260px] bg-muted" />
            <div className="h-20 bg-muted rounded-2xl mx-4" />
            <div className="h-32 bg-muted rounded-2xl mx-4" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-3xl mx-4" />
            ))}
          </div>
        </main>
      </PageRoot>
    );
  }

  // Calculate played/unplayed counts for filter chips
  const filterPlayedCount = courses?.filter(c => playedCourseIds.has(c.id)).length || 0;
  const unplayedCount = courses?.filter(c => !playedCourseIds.has(c.id)).length || 0;

  return (
    <PageRoot className="min-h-screen bg-background compact-header-offset">
      <main>
        {/* 1. Full-bleed Hero + Progress Slab */}
        {listSummary && (
          <Top100HeroShell
            list={listSummary}
            playedCount={playedCount}
            totalCount={totalCount}
            listDisplayName={listDisplayName}
            onBack={() => navigate('/top100')}
            showProgress={!!session}
          />
        )}

        {/* 2. Progress Card with next milestone + motivational copy */}
        {/* Spacing: Progress bar → Next milestone = 16px (M) */}
        {session && (
          <Top100ListProgressCard
            playedCount={playedCount}
            totalCount={totalCount}
            listSlug={slug || 'global'}
            listDisplayName={listDisplayName}
            userId={user?.id}
          />
        )}

        {/* 3. Social Leaderboard */}
        {/* Spacing: Next milestone → Leaderboard = 24px (L) */}
        {session && (
          <div className="mt-6">
            <Top100ListLeaderboard
              friends={friendsSummary}
              totalInList={totalCount}
              listName={listDisplayName}
              currentUserPlayed={playedCount}
            />
          </div>
        )}

        {/* 4. Milestones - horizontal rail with regional theming */}
        {/* Spacing: Leaderboard → Milestones = 32px (XL) */}
        {session && (
          <div className="mt-8">
            <Top100ListMilestoneRail playedCount={playedCount} listSlug={slug} />
          </div>
        )}

        {/* Ref target for scroll-to-top after pagination */}
        <div ref={listTopRef} />

        {/* 5. Filter Chips (sticky) - with scroll-to-top inside when sticky */}
        {/* Spacing: Token rail → Filter = 16px (M) */}
        <div 
          ref={filterRef} 
          className={`mt-4 ${isFilterSticky ? 'sticky top-0 z-10' : ''}`}
        >
          <Top100ListFilterChips
            activeFilter={filterChip}
            onFilterChange={setFilterChip}
            activeSort={sortMode}
            onSortChange={setSortMode}
            counts={{ played: filterPlayedCount, unplayed: unplayedCount }}
            isSticky={isFilterSticky}
            hasReviewData={hasReviewData}
          />
          
          {/* Scroll-to-top arrow positioned below sticky filters - matching ScrollToTopGlass style */}
          {isFilterSticky && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-800/70 backdrop-blur-sm border border-white/10 opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 6. Course List with Journey Insights */}
        {/* Spacing: Filter → Divider = 24px (L), Divider → List = 16px (M) */}
        {/* Combined: Filter → List = 16px (M) since no explicit divider component */}
        <section className="mt-4 pb-6 space-y-3">
          {displayedCourses.map((course, index) => {
            // Insert insight card every N courses
            const shouldInsertInsight = 
              index > 0 && 
              index % INSIGHT_INTERVAL === 0 && 
              journeyInsights[Math.floor(index / INSIGHT_INTERVAL) - 1];
            
            const insightText = shouldInsertInsight 
              ? journeyInsights[Math.floor(index / INSIGHT_INTERVAL) - 1] 
              : null;

            return (
              <React.Fragment key={course.id}>
                {insightText && (
                  <JourneyInsightCard insight={insightText} />
                )}
                <Top100ListCourseCard
                  listSlug={slug}
                  course={{
                    id: course.id,
                    name: course.name,
                    rank: course.rank,
                    imageUrl: course.thumbnail_image,
                    country: course.country,
                    subCountry: course.sub_country,
                    played: playedCourseIds.has(course.id),
                    communityRating: course.communityRating,
                    globalRank: course.global_rank,
                    regionalRank: course.regional_rank,
                    usaRank: course.usa_rank,
                  }}
                  onClick={() => handleOpenCourse(course.id)}
                />
              </React.Fragment>
            );
          })}

          {displayedCourses.length === 0 && (
            <div className="text-center py-12 mx-4">
              <p className="text-muted-foreground text-lg">
                No courses match your current filter
              </p>
            </div>
          )}
        </section>

        {/* 7. Pagination - Load More button matching Explore page exactly */}
        {hasMoreCourses && (
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

        {/* End message when all courses shown */}
        {!hasMoreCourses && displayedCourses.length > PAGE_SIZE && (
          <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
            You've reached the end • {totalFiltered.toLocaleString()} courses total
          </p>
        )}

      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <GolfClubView
          courseId={selectedCourseId}
          isInModal={true}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

      {/* Global scroll to top button - only show when filters are not sticky */}
      {!isFilterSticky && <ScrollToTopGlass />}
    </PageRoot>
  );
};

export default Top100List;
