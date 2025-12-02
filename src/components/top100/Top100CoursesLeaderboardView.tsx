import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilterBar';

interface Top100CoursesLeaderboardViewProps {
  filters: Top100LeaderboardFilters;
}

const PAGE_SIZE = 10;

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

  const scope = mapFiltersToScope(filters);
  const timeRange = mapFiltersToTimeRange(filters);

  const { data, isLoading } = useTop100CourseLeaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

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
        // TODO: Implement recently popular sorting
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'official_rank':
      default:
        // Keep original order (by official rank)
        return courses;
    }
  }, [allCourseEntries, filters.sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);
  const paginatedCourses = sortedCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext = (page + 1) * PAGE_SIZE < sortedCourses.length;
  const hasPrev = page > 0;

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
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-sm font-semibold text-foreground">
        {filters.sortBy === 'member_rating'
          ? 'Highest rated Top 100 courses'
          : filters.sortBy === 'most_played'
          ? 'Most played Top 100 courses'
          : 'Top 100 courses by official ranking'}
      </h2>

      {/* Course Cards */}
      <section className="space-y-3">
        {paginatedCourses.map((course, index) => {
          const rank = page * PAGE_SIZE + index + 1;
          const hasImage = !!course.thumbnail_url;
          const rating = course.avg_rating ?? null;

          return (
            <button
              key={course.course_id}
              type="button"
              onClick={() => navigate(`/courses/${course.course_id}`)}
              className="w-full rounded-2xl overflow-hidden bg-card border border-border/60 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image with overlay */}
              {hasImage && (
                <div className="relative h-40 w-full bg-muted">
                  <img
                    src={course.thumbnail_url!}
                    alt={course.course_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Rank pill top-left */}
                  <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm">
                    #{rank}
                  </div>
                </div>
              )}

              {/* Meta block */}
              <div className="flex items-stretch justify-between gap-3 px-4 py-3">
                {/* Left side text */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!hasImage && (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        #{rank}
                      </span>
                    )}
                    <div className="text-sm font-semibold truncate">
                      {course.course_name}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {course.sub_country && `${course.sub_country}, `}
                    {course.country}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Played {course.times_played} time{course.times_played === 1 ? '' : 's'} by members
                    {rating !== null && ` · Avg rating ${rating.toFixed(1)}`}
                  </div>
                </div>

                {/* Right rating panel */}
                {rating !== null && (
                  <div className="flex flex-col items-end justify-center shrink-0">
                    <div className="text-lg font-semibold leading-none">
                      {rating.toFixed(1)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Clbhouz rating
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </section>

      {/* Empty State */}
      {sortedCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No courses found with the selected filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
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
