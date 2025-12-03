import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard, CourseLeaderboardEntry } from '@/hooks/useTop100CourseLeaderboard';
import { useTop100FriendRecentActivity } from '@/hooks/useTop100FriendRecentActivity';
import { useTop100CourseMovers } from '@/hooks/useTop100CourseMovers';
import { useMyCourseShortlist } from '@/hooks/useMyCourseShortlist';
import { useToggleCourseShortlist } from '@/hooks/useToggleCourseShortlist';
import { LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';
import { Top100FriendCoursesStrip } from './Top100FriendCoursesStrip';
import { Top100CourseMoversStrip } from './Top100CourseMoversStrip';
import { getCourseTrophies } from './getCourseTrophies';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { Bookmark } from 'lucide-react';
import { SectionLabel, CourseRankingsIcon } from './SectionLabel';

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
  const [viewScope, setViewScope] = useState<'all' | 'friends' | 'shortlist'>('all');

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

  // Phase 3: Shortlist
  const { data: myShortlistSet } = useMyCourseShortlist();
  const toggleShortlist = useToggleCourseShortlist();

  const allCourseEntries = data?.pages.flatMap(page => page.entries) || [];

  // Sort based on filter
  const sortedCourses = useMemo(() => {
    const courses = [...allCourseEntries];
    
    switch (filters.sortBy) {
      case 'member_rating':
        return courses.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      case 'most_played':
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'recently_popular':
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'official_rank':
      default:
        return courses;
    }
  }, [allCourseEntries, filters.sortBy]);

  // Filter by viewScope (Everyone vs Friends' picks vs My shortlist)
  const visibleCourses = useMemo(() => {
    if (viewScope === 'friends') {
      return sortedCourses.filter((c) => (c.friends_count ?? 0) > 0);
    }
    if (viewScope === 'shortlist') {
      return sortedCourses.filter((c) => 
        c.shortlisted_by_me || (myShortlistSet?.has(c.course_id) ?? false)
      );
    }
    return sortedCourses;
  }, [sortedCourses, viewScope, myShortlistSet]);

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

      {/* Section Label + scope toggle */}
      <div className="px-4 sm:px-0">
        <SectionLabel icon={<CourseRankingsIcon />} label="Course rankings" />
        <p className="mt-1 text-xs text-muted-foreground">
          {viewScope === 'shortlist'
            ? 'Your trip shortlist'
            : filters.sortBy === 'member_rating'
            ? 'Highest rated Top 100 courses for your filters'
            : filters.sortBy === 'most_played'
            ? 'Most played Top 100 courses for your filters'
            : 'Top 100 courses by official ranking'}
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 mb-3">

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
          <button
            type="button"
            onClick={() => setViewScope('shortlist')}
            className={cn(
              'px-2.5 py-1 rounded-full transition-colors',
              viewScope === 'shortlist'
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground'
            )}
          >
            Shortlist
          </button>
        </div>
      </div>

      {/* Course Cards - Full bleed on mobile */}
      <div className="-mx-4 sm:mx-0">
        <section className="space-y-3">
          {paginatedCourses.map((course, index) => {
            const hasImage = !!course.thumbnail_url;
            const rating = course.avg_rating ?? null;
            const tags = getCourseTags(course, filters);
            const trophies = getCourseTrophies(course, index);
            const isShortlisted = course.shortlisted_by_me || (myShortlistSet?.has(course.course_id) ?? false);

            return (
              <button
                key={course.course_id}
                type="button"
                onClick={() => navigate(`/courses/${course.course_id}`)}
                className="w-full rounded-none sm:rounded-xl overflow-hidden bg-card border-y sm:border border-border/60 text-left shadow-none sm:shadow-sm hover:sm:shadow-md transition-all"
              >
                {/* Image with overlay - matching My Progress aspect ratio */}
                {hasImage && (
                  <div className="relative w-full aspect-[1.6/1] overflow-hidden">
                    <img
                      src={course.thumbnail_url!}
                      alt={course.course_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    
                    {/* Gradient overlay */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                    
                    {/* Rank badges top-left */}
                    <CourseRankBadges
                      globalRank={course.global_rank}
                      regionalRank={course.regional_rank}
                      usaRank={course.usa_rank}
                      country={course.country || ''}
                      positioning="top-left"
                    />

                    {/* Phase 2C: Trophy badge top-right */}
                    {trophies.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center rounded-full bg-background/95 border border-border/70 px-2 py-0.5 text-[11px] font-medium">
                          {trophies[0].label}
                        </span>
                      </div>
                    )}

                    {/* Phase 3: Trip shortlist button bottom-right */}
                    <div className="absolute bottom-2 right-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShortlist.mutate({
                            courseId: course.course_id,
                            currentlyShortlisted: isShortlisted,
                          });
                        }}
                        aria-pressed={isShortlisted}
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] shadow-xs backdrop-blur-sm transition-colors',
                          isShortlisted
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background/90 text-foreground border-border/70 hover:bg-muted/80'
                        )}
                      >
                        <Bookmark
                          className={cn(
                            'h-3.5 w-3.5',
                            isShortlisted && 'fill-background'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Meta block - matching My Progress structure */}
                <div className="px-4 py-3 bg-background space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!hasImage && (course.global_rank || course.regional_rank || course.usa_rank) && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            #{course.global_rank || course.regional_rank || course.usa_rank}
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {course.course_name}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {course.sub_country && `${course.sub_country}, `}
                        {course.country}
                      </p>
                      
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Rated by {course.times_played} member{course.times_played === 1 ? '' : 's'}
                      </p>

                      {/* Friends line */}
                      {course.friends_count > 0 ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Rated by {course.friends_count}{' '}
                          {course.friends_count === 1 ? 'friend' : 'friends'}
                          {course.friends_avg_rating != null && (
                            <>
                              {' · '}
                              Friends' avg {course.friends_avg_rating.toFixed(1)}
                            </>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          No friends have rated this course yet
                        </p>
                      )}

                      {/* Shortlist social proof */}
                      {course.shortlisted_count > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {course.shortlisted_count} member
                          {course.shortlisted_count === 1 ? '' : 's'} have this on their trip shortlist
                        </p>
                      )}

                      {/* Smart Tags */}
                      {tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-background/80"
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Clbhouz logo and rating */}
                    {rating !== null && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <ClubhouseLogo className="h-5 w-5" />
                        <span className="text-sm font-semibold text-foreground">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>

      {/* Empty State */}
      {visibleCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {viewScope === 'shortlist'
              ? 'Your shortlist is empty. Tap the bookmark icon on any course to build your dream trip.'
              : viewScope === 'friends'
              ? 'None of your friends have rated Top 100 courses yet.'
              : 'No courses found with the selected filters.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs px-1">
          <button
            type="button"
            onClick={() => hasPrev && setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 font-medium transition-colors',
              hasPrev
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Previous
          </button>

          <span className="min-w-[90px] text-center text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => hasNext && setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={!hasNext}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-full border px-3 py-2 font-medium transition-colors',
              hasNext
                ? 'bg-card hover:bg-muted/70 border-border text-foreground'
                : 'bg-muted/40 border-border/60 text-muted-foreground cursor-default'
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
