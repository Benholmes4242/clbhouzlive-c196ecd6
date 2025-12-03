import React, { useState, useMemo } from 'react';
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
  Top100ListFooter,
  Top100ListCourseCard,
  type SortMode,
  type FilterMode,
} from '@/components/top100/list';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

const REGION_DISPLAY_NAMES: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'Britain & Ireland',
  usa: 'USA',
  europe: 'Continental Europe',
};

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, user } = useSupabaseSession();

  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(user?.id);
  const { data: userActivity } = useUserCourseActivity(user?.id);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('official');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Find the current list
  const currentList = lists?.find((l) => l.slug === slug);

  // Fetch courses for this list (including #1 hero course)
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

      // Get course IDs to fetch ratings
      const courseIds = (data || []).map((item: any) => item.golf_courses.id);
      
      // Fetch community ratings for all courses
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
  const firstUnplayedCourse = courses?.find((c) => !playedCourseIds.has(c.id));

  // Build list summary for the region card (same format as Courses tab)
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


  // Get display name for this list
  const listDisplayName = REGION_DISPLAY_NAMES[slug || 'global'] || 'Worldwide';

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

    // Apply filter
    if (filterMode === 'played') {
      filtered = filtered.filter((c) => playedCourseIds.has(c.id));
    } else if (filterMode === 'not-played') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    }
    // TODO: shortlisted filter

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'official':
          return a.rank - b.rank;
        case 'rating-desc':
          return 0; // TODO: implement rating sort when we have ratings
        case 'rating-asc':
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
  }, [courses, sortMode, filterMode, playedCourseIds]);

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
        {/* 1. Hero Section - Full-width with back button */}
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

        {/* 2. User Progress Strip */}
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
            listName={currentList?.name || 'Top 100'}
            playedCount={playedCount}
            totalCount={totalCount}
          />
        )}

        {/* 5. Sort & Filter Bar */}
        <Top100ListFilters
          sortBy={sortMode}
          onSortChange={setSortMode}
          courseFilter={filterMode}
          onFilterChange={setFilterMode}
        />

        {/* 6. Course List */}
        <section className="mt-4 pb-6 space-y-3">
          {filteredAndSortedCourses.map((course) => (
            <Top100ListCourseCard
              key={course.id}
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

        {/* 7. Footer Engagement */}
        <Top100ListFooter
          onOpenPlanner={() => {
            // TODO: implement course planner
            console.log('Open course planner');
          }}
        />
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
