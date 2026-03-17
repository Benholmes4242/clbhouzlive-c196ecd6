import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useFriendsTop100Progress } from '@/hooks/useFriendsTop100Progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import GolfClubView from '@/components/golf-club/GolfClubView';

import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import {
  Top100ListLeaderboard,
  Top100ListFilterChips,
  Top100ListCourseCard,
  Top100ListProgressCard,
  JourneyInsightCard,
  generateJourneyInsights,
  type Top100FilterChip,
} from '@/components/top100/list';
import type { Top100SortMode } from '@/components/top100/list/Top100ListFilterChips';

/**
 * Canonical slug → rank field mapping (LOCKED).
 * Returns the official rank value for a course based on the list slug.
 */
const getOfficialRankForSlug = (
  course: { global_rank?: number | null; regional_rank?: number | null; usa_rank?: number | null },
  slug: string | undefined
): number | null => {
  switch (slug) {
    case 'global':
      return course.global_rank ?? null;
    case 'usa':
      return course.usa_rank ?? null;
    case 'gb-i':
    case 'europe':
      // Country filtering already handled upstream in list query
      return course.regional_rank ?? null;
    default:
      return course.global_rank ?? null;
  }
};
import { Top100HeroShell } from '@/components/top100/Top100HeroShell';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';

const REGION_DISPLAY_NAMES: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'Great Britain & Ireland',
  usa: 'USA',
  europe: 'Continental Europe',
};

const INSIGHT_INTERVAL = 10; // Insert insight card every N courses

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, user } = useSupabaseSession();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);

  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(user?.id);
  const { data: userActivity } = useUserCourseActivity(user?.id);


  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [filterChip, setFilterChip] = useState<Top100FilterChip>(() => {
    try {
      const saved = sessionStorage.getItem('top100-list-filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filterChip) return parsed.filterChip;
      }
    } catch {}
    return 'official';
  });
  const [sortMode, setSortMode] = useState<Top100SortMode>(() => {
    try {
      const saved = sessionStorage.getItem('top100-list-filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sortMode) return parsed.sortMode;
      }
    } catch {}
    return 'rating_high';
  });

  // When switching to Played/Unplayed, force sort to rating_high
  const handleFilterChange = (newFilter: Top100FilterChip) => {
    setFilterChip(newFilter);
    if (newFilter === 'played' || newFilter === 'unplayed') {
      setSortMode('rating_high');
    }
  };
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top on mount / slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  // Restore scroll from sessionStorage on mount
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem('top100:list:scrollY');

    if (savedScrollY) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: Number(savedScrollY),
          left: 0,
          behavior: 'auto',
        });
      });
    }

    sessionStorage.removeItem('top100:list:scrollY');
  }, []);

  // Persist filter state
  useEffect(() => {
    try {
      sessionStorage.setItem('top100-list-filters', JSON.stringify({
        filterChip,
        sortMode,
      }));
    } catch { /* ignore */ }
  }, [filterChip, sortMode]);


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
        .select('course_id, avg_overall_score, review_count')
        .in('course_id', courseIds);

      const ratingsMap = new Map(
        (ratingsData || []).map((r: any) => [r.course_id, { 
          avgRating: r.avg_overall_score, 
          reviewCount: r.review_count || 0 
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



  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = [...courses];

    // Step 1: Apply played/unplayed subset filter first
    if (filterChip === 'unplayed') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    } else if (filterChip === 'played') {
      filtered = filtered.filter((c) => playedCourseIds.has(c.id));
    }
    // 'official' and 'community' don't filter, only affect sort context

    // Step 2: Apply sort using slug→rank mapping
    // Helper for deterministic tie-breakers: name A→Z, then id
    const tieBreak = (a: typeof filtered[0], b: typeof filtered[0]): number => {
      const nameCompare = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      if (nameCompare !== 0) return nameCompare;
      return a.id.localeCompare(b.id);
    };

    filtered.sort((a, b) => {
      // Compute official rank for each course based on slug (null → bottom)
      const officialRankA = getOfficialRankForSlug(a, slug) ?? Number.MAX_SAFE_INTEGER;
      const officialRankB = getOfficialRankForSlug(b, slug) ?? Number.MAX_SAFE_INTEGER;

      // Helper: check if course has a community rating
      const hasRatingA = a.communityRating != null;
      const hasRatingB = b.communityRating != null;

      switch (sortMode) {
        case 'rating_high':
          // If Show = Official Rating OR Played/Unplayed: sort by officialRank ASC (1→100, best first)
          if (filterChip === 'official' || filterChip === 'played' || filterChip === 'unplayed') {
            if (officialRankA !== officialRankB) return officialRankA - officialRankB;
            return tieBreak(a, b);
          }
          // Community → rated first, then unrated
          // Separate rated vs unrated: rated courses come first
          if (hasRatingA && !hasRatingB) return -1;
          if (!hasRatingA && hasRatingB) return 1;
          // Both rated: sort by communityRating DESC
          if (hasRatingA && hasRatingB) {
            if (a.communityRating !== b.communityRating) return b.communityRating! - a.communityRating!;
            if (officialRankA !== officialRankB) return officialRankA - officialRankB;
            return tieBreak(a, b);
          }
          // Both unrated: sort by officialRank ASC, then tie-break
          if (officialRankA !== officialRankB) return officialRankA - officialRankB;
          return tieBreak(a, b);

        case 'rating_low':
          // If Show = Official Rating: sort by officialRank DESC (100→1, worst first)
          if (filterChip === 'official') {
            if (officialRankA !== officialRankB) return officialRankB - officialRankA;
            return tieBreak(a, b);
          }
          // Community → rated first, then unrated
          if (hasRatingA && !hasRatingB) return -1;
          if (!hasRatingA && hasRatingB) return 1;
          // Both rated: sort by communityRating ASC
          if (hasRatingA && hasRatingB) {
            if (a.communityRating !== b.communityRating) return a.communityRating! - b.communityRating!;
            if (officialRankA !== officialRankB) return officialRankA - officialRankB;
            return tieBreak(a, b);
          }
          // Both unrated: sort by officialRank ASC, then tie-break
          if (officialRankA !== officialRankB) return officialRankA - officialRankB;
          return tieBreak(a, b);

        case 'most_rated':
          // Sort by reviewCount DESC, tie-breaker: communityRating DESC, then officialRank ASC, then name/id
          if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
          const mrRatingA = a.communityRating ?? 0;
          const mrRatingB = b.communityRating ?? 0;
          if (mrRatingB !== mrRatingA) return mrRatingB - mrRatingA;
          if (officialRankA !== officialRankB) return officialRankA - officialRankB;
          return tieBreak(a, b);

        case 'az':
          const azCompare = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          if (azCompare !== 0) return azCompare;
          return a.id.localeCompare(b.id);

        case 'za':
          const zaCompare = b.name.toLowerCase().localeCompare(a.name.toLowerCase());
          if (zaCompare !== 0) return zaCompare;
          return b.id.localeCompare(a.id);

        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, filterChip, sortMode, playedCourseIds, slug]);

  // Save scroll before navigating to course detail
  const handleOpenCourse = useCallback((courseId: string) => {
    sessionStorage.setItem('top100:list:scrollY', String(window.scrollY));
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background" immersive immersiveStatusBar>
        <main className="pb-20">
          <div className="space-y-4 pt-0">
            <Skeleton className="h-[260px] rounded-none" />
            <Skeleton className="h-20 rounded-2xl mx-4" />
            <Skeleton className="h-32 rounded-2xl mx-4" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[16/9] rounded-none mx-0" />
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
    <PageRoot className="min-h-screen bg-background" immersive immersiveStatusBar>
      {/* 1. Full-bleed Hero + Progress Slab - MUST be direct child of PageRoot */}
      {listSummary && (
        <Top100HeroShell
          list={listSummary}
          playedCount={playedCount}
          totalCount={totalCount}
          listDisplayName={listDisplayName}
          showProgress={!!session}
        />
      )}

      <main>

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
        {/* Spacing: Next milestone → Leaderboard = 28px */}
        {session && (
          <div className="mt-7">
            <Top100ListLeaderboard
              friends={friendsSummary}
              totalInList={totalCount}
              listName={listDisplayName}
              currentUserPlayed={playedCount}
            />
          </div>
        )}


        {/* Ref target for scroll-to-top after pagination */}
        <div ref={listTopRef} />

        {/* 5. Filter Chips */}
        {/* Spacing: Token rail → Filter = 24px */}
        <div ref={filterRef} className="mt-6">
          <Top100ListFilterChips
            activeFilter={filterChip}
            onFilterChange={handleFilterChange}
            activeSort={sortMode}
            onSortChange={setSortMode}
            counts={{ played: filterPlayedCount, unplayed: unplayedCount }}
            hasReviewData={hasReviewData}
          />
        </div>

        {/* 6. Course List with Journey Insights */}
        {/* Spacing: Filter → Divider = 24px (L), Divider → List = 16px (M) */}
        {/* Combined: Filter → List = 16px (M) since no explicit divider component */}
        <section className="mt-4 pb-6 space-y-3">
          {filteredAndSortedCourses.map((course, index) => {
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
                    reviewCount: course.reviewCount,
                    globalRank: course.global_rank,
                    regionalRank: course.regional_rank,
                    usaRank: course.usa_rank,
                  }}
                  onClick={() => handleOpenCourse(course.id)}
                />
              </React.Fragment>
            );
          })}

          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12 mx-4">
              <p className="text-sm text-muted-foreground">
                No courses match your current filter
              </p>
            </div>
          )}
        </section>

      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <GolfClubView
          courseId={selectedCourseId}
          isInModal={true}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

      {/* Global scroll to top button */}
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default Top100List;
