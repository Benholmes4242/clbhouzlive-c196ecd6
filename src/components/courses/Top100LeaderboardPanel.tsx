import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { LeaderboardScope, LeaderboardTimeRange, useTop100Leaderboard, Top100LeaderboardEntry } from '@/hooks/useTop100Leaderboard';
import { useTop100CourseLeaderboard, CourseLeaderboardEntry } from '@/hooks/useTop100CourseLeaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LeaderboardRowDesktopProps = {
  row: Top100LeaderboardEntry;
  isCurrentUser: boolean;
};

const LeaderboardRowDesktop: React.FC<LeaderboardRowDesktopProps> = ({ row, isCurrentUser }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${row.user_id}?tab=top100`)}
      className={cn(
        'grid w-full grid-cols-[44px,2fr,1.4fr,1.2fr,1.1fr] items-center px-3 py-2 text-left text-[12px] transition-colors',
        'hover:bg-slate-900/70',
        isCurrentUser && 'bg-slate-900/90'
      )}
    >
      {/* Rank */}
      <div className="text-[11px] font-semibold text-slate-400">
        {row.rank}
      </div>

      {/* Player */}
      <div className="flex items-center gap-2">
        {row.avatar_url ? (
          <img
            src={row.avatar_url}
            alt={row.display_name ?? 'Player avatar'}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
            {(row.display_name?.charAt(0) ?? '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-50">
            {row.display_name || 'Unknown golfer'}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] font-medium text-emerald-300">
              You
            </span>
          )}
        </div>
      </div>

      {/* Home club */}
      <div className="truncate text-[11px] text-slate-400">
        {row.home_club || 'No club set'}
      </div>

      {/* Top 100 courses */}
      <div className="text-[12px] font-semibold text-slate-50">
        {row.total_top100_played}
      </div>

      {/* Lists completed (placeholder - will show 0 for now) */}
      <div className="text-[11px] text-slate-300">
        {row.lists_completed?.length ?? 0}
      </div>
    </button>
  );
};

type LeaderboardRowMobileProps = {
  row: Top100LeaderboardEntry;
  isCurrentUser: boolean;
};

const LeaderboardRowMobile: React.FC<LeaderboardRowMobileProps> = ({ row, isCurrentUser }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${row.user_id}?tab=top100`)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/80 px-3 py-2 text-left text-[12px] transition-colors',
        'active:bg-slate-900/90',
        isCurrentUser && 'border-emerald-500/60 bg-slate-900/90'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 text-[11px] font-semibold text-slate-400">
          {row.rank}
        </span>
        {row.avatar_url ? (
          <img
            src={row.avatar_url}
            alt={row.display_name ?? 'Player avatar'}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
            {(row.display_name?.charAt(0) ?? '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-50">
            {row.display_name || 'Unknown golfer'}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            {row.home_club || 'No club set'}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] font-medium text-emerald-300">
              You
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-semibold text-slate-50">
            {row.total_top100_played}
          </span>
          <span className="text-[10px] text-slate-400">Top 100</span>
        </div>
        <div className="text-[10px] text-slate-400">
          {row.lists_completed?.length ?? 0} list{(row.lists_completed?.length ?? 0) === 1 ? '' : 's'}
        </div>
      </div>
    </button>
  );
};

const Top100LeaderboardPanel = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevIsFetchingNextPage = useRef(false);
  const prevEntriesCount = useRef(0);
  const [viewType, setViewType] = useState<'players' | 'courses'>('players');
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');

  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage 
  } = useTop100Leaderboard({
    scope,
    timeRange,
    pageSize: 20,
  });

  const {
    data: courseData,
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    refetch: refetchCourses,
    fetchNextPage: fetchNextCoursePage,
    hasNextPage: hasNextCoursePage,
    isFetchingNextPage: isFetchingNextCoursePage,
  } = useTop100CourseLeaderboard({
    scope,
    timeRange,
    pageSize: 20,
  });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const totalCount = data?.pages[0]?.total_count || 0;
  const currentUserEntry = data?.pages[0]?.current_user_entry || null;

  const allCourseEntries = courseData?.pages.flatMap(page => page.entries) || [];

  // Smooth scroll on pagination
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentCount = allEntries.length;

    const justFinishedNextPage =
      prevIsFetchingNextPage.current && !isFetchingNextPage;

    if (justFinishedNextPage && currentCount > prevEntriesCount.current) {
      container.scrollTo({
        top: container.scrollTop + 120,
        behavior: 'smooth',
      });
    }

    prevIsFetchingNextPage.current = isFetchingNextPage;
    prevEntriesCount.current = currentCount;
  }, [allEntries.length, isFetchingNextPage]);

  const scopeLabels: Record<LeaderboardScope, string> = {
    worldwide: 'Worldwide',
    'global-top-100': 'Global Top 100',
    'gb-i-top-100': 'GB&I Top 100',
    'usa-top-100': 'USA Top 100',
    'europe-top-100': 'Europe Top 100',
  };

  const timeRangeLabels: Record<LeaderboardTimeRange, string> = {
    all_time: 'All time',
    this_year: 'This year',
    this_month: 'This month',
  };

  const listShortLabels: Record<string, string> = {
    'global-top-100': 'Global',
    'gb-i-top-100': 'GB&I',
    'usa-top-100': 'USA',
    'europe-top-100': 'Europe',
  };

  const handleScopeChange = (newScope: string) => {
    setScope(newScope as LeaderboardScope);
  };

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange as LeaderboardTimeRange);
  };

  if (isLoading && !data) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-6 pt-2 animate-pulse sm:px-4 sm:pt-3">
        <div className="h-24 bg-slate-900/70 rounded-3xl" />
        <div className="h-10 bg-slate-900/70 rounded-2xl" />
        <div className="flex gap-3">
          <div className="h-10 bg-slate-900/70 rounded-2xl flex-1" />
          <div className="h-10 bg-slate-900/70 rounded-2xl flex-1" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-900/70 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-6 pt-2 sm:px-4 sm:pt-3">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Top 100 leaderboard
          </p>
          <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
            See who's leading the global Top 100 journey
          </h1>
          <p className="max-w-xl text-[12px] text-slate-400">
            Ranking golfers by Top 100 courses played. Use the filters to browse by list and region.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-1 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
          <Select value={scope} onValueChange={handleScopeChange}>
            <SelectTrigger className="min-w-[140px] bg-slate-900/80 border-slate-800/70 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(scopeLabels) as LeaderboardScope[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {scopeLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="min-w-[120px] bg-slate-900/80 border-slate-800/70 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(timeRangeLabels) as LeaderboardTimeRange[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {timeRangeLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* View Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-slate-900/80 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewType('players')}
            className={cn(
              'rounded-full px-3 py-1',
              viewType === 'players'
                ? 'bg-slate-700 text-slate-50'
                : 'text-slate-400'
            )}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setViewType('courses')}
            className={cn(
              'rounded-full px-3 py-1',
              viewType === 'courses'
                ? 'bg-slate-700 text-slate-50'
                : 'text-slate-400'
            )}
          >
            Courses
          </button>
        </div>
      </div>

      {viewType === 'courses' ? (
        <div className="space-y-4">
          {/* Loading state */}
          {isLoadingCourses && !courseData && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-900/70 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {isErrorCourses && (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/80 border border-slate-800/70">
              <p className="text-[12px] text-slate-300 mb-3">
                Failed to load course leaderboard data.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchCourses()}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isErrorCourses &&
            !isLoadingCourses &&
            allCourseEntries.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-[12px]">No Top 100 course rounds logged here yet.</p>
                <p className="text-[11px] mt-1">Be the first to put a famous track on the map.</p>
              </div>
            )}

          {/* Course leaderboard list */}
          {!isErrorCourses && allCourseEntries.length > 0 && (
            <div className="space-y-1.5">
              {allCourseEntries.map((course, index) => {
                const rank = index + 1;
                const location = course.sub_country
                  ? `${course.sub_country}, ${course.country ?? ''}`.trim()
                  : course.country || 'Location not set';

                return (
                  <button
                    key={course.course_id + '-' + rank}
                    onClick={() => navigate(`/courses/${course.course_id}`)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-2.5 text-left text-[12px] text-slate-100 transition-colors hover:border-slate-200/40 hover:bg-slate-900"
                  >
                    {/* Rank */}
                    <div className="w-10 flex-shrink-0 text-center">
                      <span className="text-sm font-semibold text-slate-50">
                        #{rank}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.course_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-slate-50">
                          {course.course_name}
                        </span>
                        {course.list_slug && course.list_slug !== 'worldwide' && (
                          <span className="flex-shrink-0 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                            {listShortLabels[course.list_slug] ?? 'Top 100'}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {location}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Played {course.times_played} time
                        {course.times_played === 1 ? '' : 's'}
                        {course.avg_rating != null && (
                          <>
                            {' · '}
                            Avg {course.avg_rating.toFixed(1)}
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 group-hover:text-slate-200">
                      View →
                    </span>
                  </button>
                );
              })}

              {/* Load more */}
              {hasNextCoursePage && (
                <div className="flex justify-center pt-3">
                  <button
                    type="button"
                    onClick={() => fetchNextCoursePage()}
                    disabled={isFetchingNextCoursePage}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[12px] font-medium text-slate-100 hover:border-slate-500 disabled:opacity-60"
                  >
                    {isFetchingNextCoursePage ? 'Loading more…' : 'Load more courses'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Main leaderboard card */}
          <section
            className="
              rounded-3xl border border-slate-800/70 bg-slate-950/85
              px-2.5 py-2.5 shadow-[0_18px_60px_rgba(15,23,42,0.55)]
              sm:px-3 sm:py-3
            "
          >
            {/* Desktop table */}
            <div className="hidden md:block">
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-1.5 px-1 py-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-9 animate-pulse rounded-xl bg-slate-900/70"
                    />
                  ))}
                </div>
              )}

              {!isLoading && data && allEntries.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-900/80 bg-slate-950">
                  {/* Table header */}
                  <div className="grid grid-cols-[44px,2fr,1.4fr,1.2fr,1.1fr] border-b border-slate-900/80 bg-slate-950/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <div>#</div>
                    <div>Golfer</div>
                    <div>Home club</div>
                    <div>Top 100 courses</div>
                    <div>Lists</div>
                  </div>

                  {/* Table body */}
                  <div className="divide-y divide-slate-900/80">
                    {allEntries.map((row) => {
                      const isCurrentUser = row.user_id === session?.user?.id;
                      return (
                        <LeaderboardRowDesktop
                          key={row.user_id}
                          row={row}
                          isCurrentUser={isCurrentUser}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {!isLoading && (!data || allEntries.length === 0) && (
                <p className="px-3 py-4 text-[12px] text-slate-400">
                  No leaderboard data found for this view yet.
                </p>
              )}
            </div>

            {/* Mobile list */}
            <div className="md:hidden">
              {/* Loading */}
              {isLoading && (
                <div className="space-y-2 pt-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-2xl bg-slate-900/70"
                    />
                  ))}
                </div>
              )}

              {!isLoading && data && allEntries.length > 0 && (
                <div className="mt-1 space-y-1.5">
                  {allEntries.map((row) => {
                    const isCurrentUser = row.user_id === session?.user?.id;
                    return (
                      <LeaderboardRowMobile
                        key={row.user_id}
                        row={row}
                        isCurrentUser={isCurrentUser}
                      />
                    );
                  })}
                </div>
              )}

              {!isLoading && (!data || allEntries.length === 0) && (
                <p className="px-1 py-3 text-[12px] text-slate-400">
                  No leaderboard data found for this view yet.
                </p>
              )}
            </div>
          </section>

          {/* Error State */}
          {isError && (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/80 border border-slate-800/70">
              <p className="text-[12px] text-slate-300 mb-3">
                Failed to load leaderboard data.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Load more */}
          {hasNextPage && !isError && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[12px] font-medium text-slate-100 hover:border-slate-500 disabled:opacity-60"
              >
                {isFetchingNextPage ? 'Loading more…' : 'Load more golfers'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Top100LeaderboardPanel;
