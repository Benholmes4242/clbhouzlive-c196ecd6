import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Top100ListUserStrip,
  Top100ListFriendsCarousel,
  Top100ListAchievementsRow,
  Top100ListFilters,
  Top100ListCourseCard,
  type SortMode,
  type FilterMode,
  type ViewMode,
} from '@/components/top100/list';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

const PAGE_SIZE = 25;

// Helper to get display name for list
function getListDisplayName(slug: string): string {
  switch (slug) {
    case 'global':
      return 'Worldwide Top 100';
    case 'gb-i':
      return 'Britain & Ireland Top 100';
    case 'usa':
      return 'USA Top 100';
    case 'europe':
      return 'Continental Europe Top 100';
    default:
      return 'Top 100';
  }
}

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, user } = useSupabaseSession();
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(user?.id);
  const { data: userActivity } = useUserCourseActivity(user?.id);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [page, setPage] = useState(0);

  // Find the current list
  const currentList = lists?.find((l) => l.slug === slug);
  const listDisplayName = slug ? getListDisplayName(slug) : 'Top 100';

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
            continent
          )
        `)
        .eq('list_id', currentList.id)
        .order('rank', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.golf_courses,
        rank: item.rank,
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

  // Build friends list for carousel
  const friendsSummary = useMemo(() => {
    return friendsProgress.map((f) => ({
      id: f.user_id,
      name: f.profile.display_name || f.profile.username || 'Unknown',
      username: f.profile.username || '',
      avatarUrl: f.profile.profile_photo_url,
      playedOnList: f.courses_played_in_list,
    }));
  }, [friendsProgress]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = [...courses];

    // Apply status filter
    if (filterMode === 'played') {
      filtered = filtered.filter((c) => playedCourseIds.has(c.id));
    } else if (filterMode === 'not-played') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    }
    // TODO: shortlisted filter when shortlist data is available

    // Apply view filter
    // TODO: friends view filter - requires extending useFriendsTop100Progress to return course_ids
    // TODO: shortlist view filter - requires shortlist data

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'rank':
          return a.rank - b.rank;
        case 'rating-high':
          // TODO: implement when rating data is available
          return 0;
        case 'rating-low':
          // TODO: implement when rating data is available
          return 0;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, sortMode, filterMode, viewMode, playedCourseIds, friendsProgress]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCourses.length / PAGE_SIZE);
  const visibleCourses = filteredAndSortedCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [sortMode, filterMode, viewMode]);

  // Scroll to top of list on page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    listContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
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

        {/* 2. Progress Strip */}
        {session && (
          <Top100ListUserStrip
            playedCount={playedCount}
            totalCourses={totalCount}
            listName={listDisplayName}
          />
        )}

        {/* 3. Friends Carousel */}
        {session && (
          <Top100ListFriendsCarousel
            friends={friendsSummary}
            totalInList={totalCount}
            listName={listDisplayName}
          />
        )}

        {/* 4. Achievements */}
        {session && (
          <Top100ListAchievementsRow
            listName={listDisplayName}
            playedCount={playedCount}
            totalCount={totalCount}
          />
        )}

        {/* 5. Sort & Filter Bar with Pagination */}
        <Top100ListFilters
          sortBy={sortMode}
          onSortChange={setSortMode}
          courseFilter={filterMode}
          onFilterChange={setFilterMode}
          view={viewMode}
          onViewChange={setViewMode}
          currentPage={page}
          totalPages={totalPages}
          totalCourses={filteredAndSortedCourses.length}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />

        {/* 6. Course List */}
        <section ref={listContainerRef} className="mt-4 pb-6">
          {visibleCourses.map((course) => (
            <Top100ListCourseCard
              key={course.id}
              rank={course.rank}
              courseName={course.name}
              country={course.country}
              subCountry={course.sub_country}
              thumbnailUrl={course.thumbnail_image}
              isPlayed={playedCourseIds.has(course.id)}
              onClick={() => setSelectedCourseId(course.id)}
            />
          ))}

          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12 mx-4">
              <p className="text-muted-foreground text-lg">
                No courses match your current filter
              </p>
            </div>
          )}
        </section>

        {/* No footer CTA - page ends after course cards */}
      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <GolfClubView
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </div>
  );
};

export default Top100List;
