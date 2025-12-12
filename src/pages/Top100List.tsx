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
  Top100ListAchievementsPair,
  Top100ListFilterChips,
  Top100ListCourseCard,
  Top100ListProgressHero,
  JourneyInsightCard,
  generateJourneyInsights,
  FloatingJourneyButton,
  type Top100FilterChip,
} from '@/components/top100/list';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import { UnifiedPagination } from '@/components/ui/UnifiedPagination';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';
import { getTop100Club, CLUB_STEPS } from '@/lib/top100Club';

const REGION_DISPLAY_NAMES: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'Great Britain & Ireland',
  usa: 'USA',
  europe: 'Continental Europe',
};

const PAGE_SIZE = 25;
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
  const [page, setPage] = useState(0);
  const [isFilterSticky, setIsFilterSticky] = useState(false);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top on mount / slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  // Restore page + scroll from sessionStorage on mount
  useEffect(() => {
    const savedPage = sessionStorage.getItem('top100:list:page');
    const savedScrollY = sessionStorage.getItem('top100:list:scrollY');

    if (savedPage) {
      setPage(Number(savedPage));
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

    sessionStorage.removeItem('top100:list:page');
    sessionStorage.removeItem('top100:list:scrollY');
  }, []);

  // Sticky filter detection
  useEffect(() => {
    const handleScroll = () => {
      if (filterRef.current) {
        const rect = filterRef.current.getBoundingClientRect();
        setIsFilterSticky(rect.top <= 56);
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
      
      const { data: ratingsData } = await supabase
        .from('course_rating_aggregates')
        .select('course_id, avg_overall_score')
        .in('course_id', courseIds);

      const ratingsMap = new Map(
        (ratingsData || []).map((r: any) => [r.course_id, r.avg_overall_score])
      );

      return (data || []).map((item: any) => ({
        ...item.golf_courses,
        rank: item.rank,
        communityRating: ratingsMap.get(item.golf_courses.id) || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

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

  // Build achievements data
  const achievementsData = useMemo(() => {
    const currentClub = getTop100Club(playedCount);
    const nextStep = CLUB_STEPS.find(s => s.threshold > playedCount);
    
    const primary = currentClub.meta ? {
      id: currentClub.tierId,
      title: currentClub.shortLabel || '',
      current: playedCount,
      target: currentClub.threshold || playedCount,
      isComplete: true,
      percentOfPlayers: playedCount >= 50 ? 5 : playedCount >= 20 ? 15 : 30,
    } : null;

    const upcoming = nextStep ? {
      id: nextStep.tierId,
      title: nextStep.shortLabel,
      current: playedCount,
      target: nextStep.threshold,
      isComplete: false,
    } : null;

    return { primary, upcoming };
  }, [playedCount]);

  // Generate journey insights
  const journeyInsights = useMemo(() => {
    if (!courses) return [];
    const playedCourses = courses
      .filter(c => playedCourseIds.has(c.id))
      .map(c => ({ id: c.id, country: c.country, rank: c.rank }));
    return generateJourneyInsights(playedCourses, totalCount, slug);
  }, [courses, playedCourseIds, totalCount, slug]);

  // Closest friend for floating button
  const closestFriend = useMemo(() => {
    if (friendsSummary.length === 0) return undefined;
    const sorted = [...friendsSummary].sort((a, b) => 
      Math.abs(a.playedOnList - playedCount) - Math.abs(b.playedOnList - playedCount)
    );
    const closest = sorted[0];
    if (closest && closest.playedOnList !== playedCount) {
      return { name: closest.name, played: closest.playedOnList };
    }
    return undefined;
  }, [friendsSummary, playedCount]);

  // Calculate next milestone for floating button
  const nextMilestoneData = useMemo(() => {
    const nextStep = CLUB_STEPS.find(s => s.threshold > playedCount);
    return {
      name: nextStep?.shortLabel || 'Grand Slam',
      toNext: nextStep ? nextStep.threshold - playedCount : 0,
    };
  }, [playedCount]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [filterChip]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = [...courses];

    // Apply filter based on chip
    if (filterChip === 'unplayed') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (filterChip) {
        case 'official':
          return a.rank - b.rank;
        case 'highest-rated':
          return (b.communityRating || 0) - (a.communityRating || 0);
        case 'most-played':
          // Would need play count data - for now keep official order
          return a.rank - b.rank;
        case 'unplayed':
          return a.rank - b.rank;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, filterChip, playedCourseIds]);

  // Pagination calculations
  const totalFiltered = filteredAndSortedCourses.length;
  const hasNextPage = (page + 1) * PAGE_SIZE < totalFiltered;
  const hasPrevPage = page > 0;

  // Paginated courses for current page
  const paginatedCourses = useMemo(() => {
    return filteredAndSortedCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredAndSortedCourses, page]);

  // Scroll to list top after pagination
  const scrollToListTop = useCallback(() => {
    if (listTopRef.current) {
      window.scrollTo({
        top: listTopRef.current.offsetTop - 16,
        left: 0,
        behavior: 'auto',
      });
    }
  }, []);

  const handlePrevPage = useCallback(() => {
    if (!hasPrevPage) return;
    setPage((p) => p - 1);
    scrollToListTop();
  }, [hasPrevPage, scrollToListTop]);

  const handleNextPage = useCallback(() => {
    if (!hasNextPage) return;
    setPage((p) => p + 1);
    scrollToListTop();
  }, [hasNextPage, scrollToListTop]);

  // Save page + scroll before navigating to course detail
  const handleOpenCourse = useCallback((courseId: string) => {
    sessionStorage.setItem('top100:list:page', String(page));
    sessionStorage.setItem('top100:list:scrollY', String(window.scrollY));
    navigate(`/courses/${courseId}`);
  }, [page, navigate]);

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background">
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

  // Calculate unplayed count for filter chip
  const unplayedCount = courses?.filter(c => !playedCourseIds.has(c.id)).length || 0;

  return (
    <PageRoot className="min-h-screen bg-background">
      <main>
        {/* 1. Hero Section */}
        {listSummary && (
          <section className="px-4">
            <Top100RegionCard
              list={listSummary}
              showCta={false}
              variant="hero"
              onBack={() => navigate('/top100')}
            />
          </section>
        )}

        {/* 2. Progress Hero Module */}
        {session && (
          <Top100ListProgressHero
            playedCount={playedCount}
            totalCount={totalCount}
            listName={listDisplayName}
            listSlug={slug}
          />
        )}

        {/* 3. Social Leaderboard */}
        {session && (
          <Top100ListLeaderboard
            friends={friendsSummary}
            totalInList={totalCount}
            listName={listDisplayName}
            currentUserPlayed={playedCount}
          />
        )}

        {/* 4. Achievements Pair */}
        {session && (
          <Top100ListAchievementsPair
            primary={achievementsData.primary}
            upcoming={achievementsData.upcoming}
          />
        )}

        {/* Ref target for scroll-to-top after pagination */}
        <div ref={listTopRef} />

        {/* 5. Filter Chips (sticky) */}
        <div ref={filterRef} className={isFilterSticky ? 'sticky top-14 z-10' : ''}>
          <Top100ListFilterChips
            activeFilter={filterChip}
            onFilterChange={setFilterChip}
            counts={{ unplayed: unplayedCount }}
            isSticky={isFilterSticky}
          />
        </div>

        {/* 6. Course List with Journey Insights */}
        <section className="mt-4 pb-6 space-y-3">
          {paginatedCourses.map((course, index) => {
            // Insert insight card every N courses
            const absoluteIndex = page * PAGE_SIZE + index;
            const shouldInsertInsight = 
              absoluteIndex > 0 && 
              absoluteIndex % INSIGHT_INTERVAL === 0 && 
              journeyInsights[Math.floor(absoluteIndex / INSIGHT_INTERVAL) - 1];
            
            const insightText = shouldInsertInsight 
              ? journeyInsights[Math.floor(absoluteIndex / INSIGHT_INTERVAL) - 1] 
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

          {paginatedCourses.length === 0 && (
            <div className="text-center py-12 mx-4">
              <p className="text-muted-foreground text-lg">
                No courses match your current filter
              </p>
            </div>
          )}
        </section>

        {/* 7. Pagination */}
        <div className="px-4 pb-[24px]">
          <UnifiedPagination
            page={page}
            total={totalFiltered}
            pageSize={PAGE_SIZE}
            hasNextPage={hasNextPage}
            onNext={handleNextPage}
            onPrev={handlePrevPage}
            scrollTargetRef={listTopRef as React.RefObject<HTMLElement>}
          />
        </div>

      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <GolfClubView
          courseId={selectedCourseId}
          isInModal={true}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

      {/* Floating Journey Button */}
      {session && (
        <FloatingJourneyButton
          playedCount={playedCount}
          totalCount={totalCount}
          nextMilestone={nextMilestoneData.name}
          toNextMilestone={nextMilestoneData.toNext}
          closestFriend={closestFriend}
        />
      )}

      {/* Scroll to top button */}
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default Top100List;