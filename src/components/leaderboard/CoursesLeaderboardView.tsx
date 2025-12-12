import React, { useState, useMemo } from 'react';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardCourseCard } from './LeaderboardCourseCard';
import { cn } from '@/lib/utils';

type CourseSortOption = 'most_played' | 'highest_rated' | 'trending' | 'friends';

const SORT_OPTIONS: { value: CourseSortOption; label: string }[] = [
  { value: 'most_played', label: 'Most Played' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'trending', label: 'Trending' },
  { value: 'friends', label: 'Friends Playing' },
];

// Context copy based on sort
const CONTEXT_COPY: Record<CourseSortOption, string> = {
  most_played: 'Most played Top 100 courses',
  highest_rated: 'Top 100 courses by community rating',
  trending: 'Courses gaining momentum this month',
  friends: 'Courses your circle is playing most',
};

export function CoursesLeaderboardView() {
  const [sort, setSort] = useState<CourseSortOption>('most_played');

  const { data, isLoading } = useTop100CourseLeaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    pageSize: 200,
  });

  const allCourses = data?.pages.flatMap(page => page.entries) || [];

  // Sort courses based on selection
  const sortedCourses = useMemo(() => {
    const courses = [...allCourses];
    
    switch (sort) {
      case 'highest_rated':
        return courses.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      case 'trending':
        // Recent plays weighted higher
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'friends':
        return courses
          .filter((c) => (c.friends_count ?? 0) > 0)
          .sort((a, b) => (b.friends_count ?? 0) - (a.friends_count ?? 0));
      case 'most_played':
      default:
        return courses.sort((a, b) => b.times_played - a.times_played);
    }
  }, [allCourses, sort]);

  // Insert soft dividers every 20 items
  const renderList = () => {
    const elements: React.ReactNode[] = [];
    
    sortedCourses.forEach((course, idx) => {
      // Soft dividers at 20, 50, 100
      if (idx === 20) {
        elements.push(
          <div key="divider-20" className="px-4 py-2 bg-muted/30 border-y border-border/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Ranks 21–50
            </p>
          </div>
        );
      } else if (idx === 50) {
        elements.push(
          <div key="divider-50" className="px-4 py-2 bg-muted/30 border-y border-border/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Ranks 51–100
            </p>
          </div>
        );
      } else if (idx === 100) {
        elements.push(
          <div key="divider-100" className="px-4 py-2 bg-muted/30 border-y border-border/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Beyond Top 100
            </p>
          </div>
        );
      }

      elements.push(
        <LeaderboardCourseCard
          key={course.course_id}
          course={course}
          listPosition={idx + 1}
        />
      );
    });

    return elements;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-sq-pill" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-sq-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context strip */}
      <div className="px-2.5">
        <p className="text-sm text-muted-foreground">
          {CONTEXT_COPY[sort]}
        </p>
      </div>

      {/* Sort options - sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="inline-flex rounded-sq-pill bg-muted/60 p-1 text-xs font-medium min-w-max">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-sq-pill transition-all whitespace-nowrap',
                  sort === opt.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course List - infinite scroll style */}
      <div className="-mx-4 sm:mx-0">
        <div className="space-y-2">
          {sortedCourses.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                {sort === 'friends'
                  ? 'None of your friends have rated Top 100 courses yet.'
                  : 'No courses found.'}
              </p>
            </div>
          ) : (
            renderList()
          )}
        </div>
      </div>

      {/* Gamification micro-moment */}
      {sortedCourses.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            Tap any course to see details and log your round.
          </p>
        </div>
      )}
    </div>
  );
}
