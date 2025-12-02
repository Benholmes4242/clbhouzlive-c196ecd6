import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { LeaderboardScope, LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { Top100LeaderboardFilters } from './Top100LeaderboardFilters';
import { Skeleton } from '@/components/ui/skeleton';

export function Top100CoursesLeaderboardView() {
  const navigate = useNavigate();
  
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');

  const { data, isLoading } = useTop100CourseLeaderboard({
    scope,
    timeRange,
    pageSize: 100,
  });

  const allCourseEntries = data?.pages.flatMap(page => page.entries) || [];

  // Sort by times played, then by rating
  const sortedCourses = [...allCourseEntries].sort((a, b) => {
    if (a.times_played !== b.times_played) {
      return b.times_played - a.times_played;
    }
    return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
  });

  const handleFiltersChange = (updates: {
    scope?: LeaderboardScope;
    timeRange?: LeaderboardTimeRange;
  }) => {
    if (updates.scope !== undefined) setScope(updates.scope);
    if (updates.timeRange !== undefined) setTimeRange(updates.timeRange);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Top100LeaderboardFilters
        mode="courses"
        scope={scope}
        timeRange={timeRange}
        onChange={handleFiltersChange}
      />

      {/* Courses List */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Most popular Top 100 courses
        </h2>

        <div className="space-y-2">
          {sortedCourses.map((course, index) => {
            const hasImage = !!course.thumbnail_url;
            const rating = course.avg_rating ?? null;

            return (
              <button
                key={course.course_id}
                onClick={() => navigate(`/courses/${course.course_id}`)}
                className="w-full rounded-2xl overflow-hidden bg-card border border-border/50 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                {/* Course Image */}
                {hasImage && (
                  <div className="relative h-32 w-full">
                    <img
                      src={course.thumbnail_url!}
                      alt={course.course_name}
                      className="h-full w-full object-cover"
                    />
                    {/* Rank badge */}
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white">
                      #{index + 1}
                    </div>
                  </div>
                )}

                {/* Course Info */}
                <div className="px-3 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Name + Location */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!hasImage && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            #{index + 1}
                          </span>
                        )}
                        <p className="text-sm font-semibold truncate">
                          {course.course_name}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {course.sub_country && `${course.sub_country}, `}
                        {course.country}
                      </p>
                    </div>

                    {/* Right: Rating */}
                    {rating !== null && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">
                          {rating.toFixed(1)} / 10
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {course.times_played} rating{course.times_played === 1 ? '' : 's'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* List badge */}
                  {course.list_slug && course.list_slug !== 'worldwide' && (
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {course.list_slug
                          .replace('-top-100', '')
                          .replace('global-', '')
                          .toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Times played */}
                  <div className="text-[11px] text-muted-foreground">
                    Played {course.times_played} time{course.times_played === 1 ? '' : 's'} by the community
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {sortedCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No courses found with the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}
