import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard, CourseLeaderboardEntry } from '@/hooks/useTop100CourseLeaderboard';
import { useTop100FriendRecentActivity } from '@/hooks/useTop100FriendRecentActivity';
import { useTop100CourseMovers } from '@/hooks/useTop100CourseMovers';
import { LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';
import { Top100FriendCoursesStrip } from './Top100FriendCoursesStrip';
import { Top100CourseMoversStrip } from './Top100CourseMoversStrip';
import { getCourseTrophies } from './getCourseTrophies';
import { UnifiedCourseCard } from '@/components/courses/UnifiedCourseCard';
import { fromLeaderboardCourse } from '@/lib/mappers/toCourseCardModel';
import { UnifiedPagination } from '@/components/ui/UnifiedPagination';
import { compareCoursesByRating } from '@/lib/sortCoursesByRating';

interface Top100CoursesLeaderboardViewProps {
  filters: Top100LeaderboardFilters;
}

const PAGE_SIZE = 10;

// Smart tag types and helper
type CourseTag =
  | { id: 'trending'; label: string }
  | { id: 'friends_fav'; label: string }
  | { id: 'hidden_gem'; label: string }
  | { id: 'bucket_list'; label: string };

function getCourseTags(
  course: CourseLeaderboardEntry,
  filters: Top100LeaderboardFilters
): CourseTag[] {
  const tags: CourseTag[] = [];
  const rating = course.avg_rating ?? 0;
  const friendsRating = course.friends_avg_rating ?? 0;
  const friendsCount = course.friends_count ?? 0;

  // Hidden gem: very high rating, low plays
  if (rating >= 9.0 && course.times_played < 20) {
    tags.push({ id: 'hidden_gem', label: 'Hidden gem' });
  }

  // Friends' favourite: strong friend signal
  if (friendsCount >= 3 && friendsRating >= 9.0) {
    tags.push({ id: 'friends_fav', label: "Friends' favourite" });
  }

  // Bucket-list classic: lots of plays & high rating
  if (course.times_played >= 100 && rating >= 8.5) {
    tags.push({ id: 'bucket_list', label: 'Bucket-list classic' });
  }

  // Trending if in a short time window and well-played
  if (
    (filters.timeRange === 'month' || filters.timeRange === 'week') &&
    course.times_played >= 10
  ) {
    tags.push({ id: 'trending', label: 'Trending this period' });
  }

  return tags.slice(0, 2); // cap at 2 tags
}

// Map new filter format to legacy scope
function mapFiltersToScope(filters: Top100LeaderboardFilters): LeaderboardScope {
  if (filters.listSlug === 'all') return 'worldwide';
  if (filters.listSlug === 'global') return 'global-top-100';
  if (filters.listSlug === 'gb-i') return 'gb-i-top-100';
  if (filters.listSlug === 'usa') return 'usa-top-100';
  if (filters.listSlug === 'europe') return 'europe-top-100';
  return 'worldwide';
}

function mapFiltersToTimeRange(filters: Top100LeaderboardFilters): LeaderboardTimeRange {
  if (filters.timeRange === 'year') return 'this_year';
  if (filters.timeRange === 'month') return 'this_month';
  return 'all_time';
}

export function Top100CoursesLeaderboardView({ filters }: Top100CoursesLeaderboardViewProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [viewScope, setViewScope] = useState<'all' | 'friends'>('all');

  const scope = mapFiltersToScope(filters);
  const timeRange = mapFiltersToTimeRange(filters);

  const { data, isLoading } = useTop100CourseLeaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

  // Phase 2A: Friend recent activity
  const { data: friendActivity } = useTop100FriendRecentActivity(scope, timeRange);

  // Phase 2B: Course movers
  const { data: movers } = useTop100CourseMovers(scope, timeRange);

  const allCourseEntries = data?.pages.flatMap(page => page.entries) || [];

  // Sort based on filter
  const sortedCourses = useMemo(() => {
    const courses = [...allCourseEntries];
    
    switch (filters.sortBy) {
      case 'member_rating':
        // CourseLeaderboardEntry has no rating_count; unique_players is the
        // closest reviewer-count signal in this shape.
        return courses.sort((a, b) =>
          compareCoursesByRating(
            { id: a.course_id, name: a.course_name, avg_rating: a.avg_rating, rating_count: a.unique_players },
            { id: b.course_id, name: b.course_name, avg_rating: b.avg_rating, rating_count: b.unique_players },
            'desc'
          )
        );
      case 'most_played':
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'recently_popular':
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'official_rank':
      default:
        return courses;
    }
  }, [allCourseEntries, filters.sortBy]);

  // Filter by viewScope (Everyone vs Friends' picks)
  const visibleCourses = useMemo(() => {
    if (viewScope === 'friends') {
      return sortedCourses.filter((c) => (c.friends_count ?? 0) > 0);
    }
    return sortedCourses;
  }, [sortedCourses, viewScope]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(visibleCourses.length / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);
  const paginatedCourses = visibleCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < visibleCourses.length;
  const hasPrev = page > 0;

  // Reset page when viewScope changes
  React.useEffect(() => {
    setPage(0);
  }, [viewScope]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div id="top100-courses-list" className="space-y-4">
      {/* Phase 2A: Friend activity strip */}
      <Top100FriendCoursesStrip items={friendActivity ?? []} />

      {/* Phase 2B: Course movers strip */}
      <Top100CourseMoversStrip items={movers ?? []} timeRange={filters.timeRange} />

      {/* Section Label + scope toggle - single row */}
      <div className="flex items-end justify-between px-2.5 gap-3 mb-3">
        {/* Left: title + subtitle */}
        <div className="flex flex-col">
          <p className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            Course rankings
          </p>
          <p className="text-xs text-muted-foreground">
            {filters.sortBy === 'member_rating'
              ? 'Top 100 courses by community rating'
              : filters.sortBy === 'most_played'
              ? "Top 100 courses by how often they're played"
              : filters.sortBy === 'recently_popular'
              ? 'Top 100 courses trending this month'
              : 'Top 100 courses by official ranking'}
          </p>
        </div>

        {/* Right: pill toggle */}
        <div className="flex-shrink-0">
          <div className="inline-flex items-center rounded-full bg-muted/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewScope('all')}
              className={cn(
                'px-2.5 py-1 rounded-full transition-colors',
                viewScope === 'all'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewScope('friends')}
              className={cn(
                'px-2.5 py-1 rounded-full transition-colors',
                viewScope === 'friends'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              Friends
            </button>
          </div>
        </div>
      </div>

      {/* Course Cards - Full bleed on mobile */}
      <div className="-mx-4 sm:mx-0">
        <section className="sm:space-y-3">
          {paginatedCourses.map((course, index) => {
            const tags = getCourseTags(course, filters);
            const trophies = getCourseTrophies(course, index);
            
            // Map to CourseCardModel
            const cardModel = fromLeaderboardCourse({
              course_id: course.course_id,
              course_name: course.course_name,
              country: course.country,
              sub_country: course.sub_country,
              thumbnail_url: course.thumbnail_url,
              avg_rating: course.avg_rating,
              global_rank: course.global_rank,
              regional_rank: course.regional_rank,
              usa_rank: course.usa_rank,
              times_played: course.times_played,
              friends_count: course.friends_count,
            });

            // Get trophy tag if available
            const contextTag = trophies.length > 0 ? trophies[0].label : undefined;

            return (
              <UnifiedCourseCard
                key={course.course_id}
                course={cardModel}
                showRankBadges={true}
                showRating={true}
                showFriendsContext={true}
                contextTag={contextTag}
                onClick={() => navigate(`/courses/${course.course_id}`)}
              />
            );
          })}
        </section>
      </div>

      {/* Empty State */}
      {visibleCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {viewScope === 'friends'
              ? 'None of your friends have rated Top 100 courses yet.'
              : 'No courses found with the selected filters.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      <UnifiedPagination
        page={page}
        total={visibleCourses.length}
        pageSize={PAGE_SIZE}
        hasNextPage={hasNext}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        itemLabel="courses"
      />
    </div>
  );
}
