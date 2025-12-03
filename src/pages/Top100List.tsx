import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useFriendsTop100Progress } from '@/hooks/useFriendsTop100Progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Top100BackButton from '@/components/top100/Top100BackButton';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import {
  Top100ListUserStrip,
  Top100ListFriendsCarousel,
  Top100ListAchievementsRow,
  Top100ListFilters,
  Top100ListFooter,
  type SortMode,
  type FilterMode,
  type ViewMode,
} from '@/components/top100/list';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import { Top100CourseListItem } from '@/components/top100/Top100CourseListItem';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

const REGION_EMOJIS: Record<string, string> = {
  global: '🌍',
  'gb-i': '🇬🇧',
  usa: '🇺🇸',
  europe: '🇪🇺',
};

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, user } = useSupabaseSession();

  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(user?.id);
  const { data: userActivity } = useUserCourseActivity(user?.id);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

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

  // Build userProgress for strip
  const totalTop100 = progressData?.totalTop100Played || 0;
  const currentClub = getTop100Club(totalTop100);
  const nextClub = getNextTop100Club(totalTop100);

  const userProgress = useMemo(() => ({
    rankAmongFriends: 1, // TODO: calculate actual rank
    totalTop100Courses: totalTop100,
    currentTierId: currentClub.tierId,
    currentTierName: currentClub.tierName,
    nextTierName: nextClub?.tierName || null,
    nextTierRemaining: nextClub ? Math.max(0, nextClub.threshold - totalTop100) : null,
  }), [totalTop100, currentClub, nextClub]);

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

    // Apply view filter
    if (viewMode === 'friends') {
      // TODO: implement friends filter with course IDs
      // For now, show all courses that any friend has played (placeholder)
    }
    // TODO: shortlist filter

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'rank':
          return a.rank - b.rank;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'country':
          return a.country.localeCompare(b.country);
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, sortMode, filterMode, viewMode, playedCourseIds, friendsProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClubhouseHeaderNew />
        <main className="pb-20">
          <div className="animate-pulse space-y-4 px-4 pt-4">
            <div className="h-[220px] bg-muted rounded-3xl" />
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-3xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />

      <main className="pb-20">
        {/* Back Button */}
        <div className="pt-4 pb-2 px-4">
          <Top100BackButton to="/top100" label="Back to Hub" />
        </div>

        {/* 1. Hero Section - Full-width with straight edges */}
        {listSummary && (
          <section className="px-4">
            <Top100RegionCard
              list={listSummary}
              showCta={false}
              variant="hero"
            />
          </section>
        )}

        {/* 2. User Rank Strip */}
        {session && (
          <Top100ListUserStrip
            userProgress={userProgress}
            userAvatarUrl={user?.user_metadata?.avatar_url}
            userName={user?.user_metadata?.display_name || user?.email}
          />
        )}

        {/* 3. Friends Carousel */}
        {session && (
          <Top100ListFriendsCarousel
            friends={friendsSummary}
            totalInList={totalCount}
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
          view={viewMode}
          onViewChange={setViewMode}
        />

        {/* 6. Course List */}
        <section className="mt-4 pb-6">
          {filteredAndSortedCourses.map((course) => {
            const countryLabel = course.sub_country 
              ? `${course.country}, ${course.sub_country}` 
              : course.country;
            
            return (
              <Top100CourseListItem
                key={course.id}
                position={course.rank}
                courseName={course.name}
                countryLabel={countryLabel}
                country={course.country}
                thumbnailUrl={course.thumbnail_image}
                isPlayed={playedCourseIds.has(course.id)}
                onClick={() => setSelectedCourseId(course.id)}
                onTogglePlayed={() => {
                  // TODO: implement toggle played
                  console.log('Toggle played:', course.id);
                }}
              />
            );
          })}

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
