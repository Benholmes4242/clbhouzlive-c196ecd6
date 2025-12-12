import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardCourseCard } from './LeaderboardCourseCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  const navigate = useNavigate();
  const [sort, setSort] = useState<CourseSortOption>('most_played');

  const { data, isLoading } = useTop100CourseLeaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    pageSize: 200,
  });

  const allCourses = data?.pages.flatMap(page => page.entries) || [];

  // Fetch recent Top 100 rounds by friends
  const { data: friendsRecentRounds } = useQuery({
    queryKey: ['friends-recent-top100-rounds'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Get friends who have rated Top 100 courses recently
      const { data } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          created_at,
          course_id,
          user_id,
          golf_courses!inner (
            id,
            name,
            thumbnail_image,
            global_rank
          ),
          user_profiles!inner (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .not('golf_courses.global_rank', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    staleTime: 60_000,
  });

  // Get trending courses (rating increases)
  const trendingCourses = useMemo(() => {
    return [...allCourses]
      .filter(c => c.avg_rating && c.avg_rating >= 7.5)
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
      .slice(0, 5);
  }, [allCourses]);

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
    <div className="space-y-5">
      {/* Recently Played by Your Circle */}
      {friendsRecentRounds && friendsRecentRounds.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-2.5">
            Recently Played by Your Circle
          </h3>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2.5 min-w-max">
              {friendsRecentRounds.slice(0, 6).map((round: any) => (
                <button
                  key={round.id}
                  onClick={() => navigate(`/courses/${round.course_id}`)}
                  className="w-[180px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card overflow-hidden shadow-sm hover:bg-muted/20 transition-colors"
                >
                  {round.golf_courses?.thumbnail_image && (
                    <div className="relative h-20 w-full">
                      <img
                        src={round.golf_courses.thumbnail_image}
                        alt={round.golf_courses.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}
                  <div className="p-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <SquircleAvatar
                        size={24}
                        src={round.user_profiles?.profile_photo_url}
                        alt={round.user_profiles?.display_name}
                        fallback={(round.user_profiles?.display_name?.[0] || '?').toUpperCase()}
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(round.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate text-left">
                      {round.golf_courses?.name}
                    </p>
                    {round.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-primary/70" />
                        <span className="text-xs text-muted-foreground">{round.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Courses on the Move */}
      {trendingCourses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-2.5">
            Courses on the Move
          </h3>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2.5 min-w-max">
              {trendingCourses.map((course) => (
                <button
                  key={course.course_id}
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                  className="w-[140px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card p-2.5 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-600">Trending</span>
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {course.course_name}
                  </p>
                  {course.avg_rating && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {course.avg_rating.toFixed(1)} avg rating
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Course List */}
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
    </div>
  );
}
