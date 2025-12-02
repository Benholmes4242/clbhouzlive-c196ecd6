import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LeaderboardScope, LeaderboardTimeRange, useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingBorderClass } from '@/lib/top100RingStyles';
import { cn } from '@/lib/utils';

const Top100LeaderboardPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Wire view from URL
  const initialView =
    searchParams.get('view') === 'courses' || searchParams.get('view') === 'players'
      ? (searchParams.get('view') as 'players' | 'courses')
      : 'players';

  const [view, setView] = useState<'players' | 'courses'>(initialView);
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');

  // Players filters
  const [playersPage, setPlayersPage] = useState(0);

  // Courses filters
  const [coursePage, setCoursePage] = useState(0);

  const handleViewChange = (next: 'players' | 'courses') => {
    setView(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', next);
    setSearchParams(nextParams, { replace: true });
  };

  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useTop100Leaderboard({
    scope,
    timeRange,
    pageSize: 100, // Fetch more for client-side filtering
  });

  const {
    data: courseData,
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    refetch: refetchCourses,
  } = useTop100CourseLeaderboard({
    scope,
    timeRange,
    pageSize: 100, // Fetch more for client-side filtering
  });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const totalCount = data?.pages[0]?.total_count || 0;
  const currentUserEntry = data?.pages[0]?.current_user_entry || null;

  const allCourseEntries = courseData?.pages.flatMap(page => page.entries) || [];

  // Get unique countries from entries
  const uniqueCountries = Array.from(
    new Set(
      allEntries
        .map(e => e.country)
        .filter((c): c is string => !!c)
    )
  ).sort();

  // Apply client-side filtering for players
  const playersPageSize = 50;

  // Apply client-side filtering for courses
  const coursePageSize = 25;
  
  let filteredCourses = [...allCourseEntries];

  // Sort courses
  filteredCourses = filteredCourses.sort((a, b) => {
    if (a.times_played !== b.times_played) {
      return b.times_played - a.times_played;
    }
    return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
  });

  const courseStart = coursePage * coursePageSize;
  const visibleCourses = filteredCourses.slice(courseStart, courseStart + coursePageSize);
  const courseHasNext = courseStart + coursePageSize < filteredCourses.length;
  const courseHasPrev = coursePage > 0;

  // Paginate players
  const playersStart = playersPage * playersPageSize;
  const visiblePlayers = allEntries.slice(playersStart, playersStart + playersPageSize);
  const playersHasNext = playersStart + playersPageSize < allEntries.length;
  const playersHasPrev = playersPage > 0;

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

  const handleScopeChange = (newScope: string) => {
    setScope(newScope as LeaderboardScope);
  };

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange as LeaderboardTimeRange);
  };

  if (isLoading && !data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6 animate-pulse">
        <div className="h-24 bg-surface-alt rounded-xl" />
        <div className="h-10 bg-surface-alt rounded-lg" />
        <div className="flex gap-3">
          <div className="h-10 bg-surface-alt rounded-lg flex-1" />
          <div className="h-10 bg-surface-alt rounded-lg flex-1" />
        </div>
        <div className="h-32 bg-surface-alt rounded-xl" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-alt rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-primary-accent" />
          <h1 className="text-3xl font-bold text-foreground">Top 100 Club – Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Elite pilgrimage mode for the whales and hardcore nuts chasing the world's Top 100.
        </p>
      </div>

      {/* View Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-muted p-1">
          <button
            type="button"
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              view === 'players'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground'
            )}
            onClick={() => handleViewChange('players')}
          >
            Players
          </button>
          <button
            type="button"
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              view === 'courses'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground'
            )}
            onClick={() => handleViewChange('courses')}
          >
            Courses
          </button>
        </div>
      </div>

      {view === 'courses' ? (
        <div className="space-y-6">
          {/* Filters */}
          <section className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Select value={scope} onValueChange={handleScopeChange}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Region" />
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
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Timeframe" />
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
          </section>

          {/* Loading state */}
          {isLoadingCourses && !courseData && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-surface-alt animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {isErrorCourses && (
            <div className="text-center py-12 px-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive mb-3">
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
              <div className="text-center py-12 text-muted-foreground">
                <p>No Top 100 course rounds logged here yet.</p>
                <p className="text-sm mt-1">Be the first to put a famous track on the map.</p>
              </div>
            )}

          {/* Course leaderboard list */}
          {!isErrorCourses && visibleCourses.length > 0 && (
            <>
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                COURSES LEADERBOARD
              </h3>
              <div className="space-y-3">
                {visibleCourses.map((course, index) => {
                  const rank = courseStart + index + 1;
                  return (
                    <button
                      key={course.course_id}
                      type="button"
                      onClick={() => navigate(`/courses/${course.course_id}`)}
                      className="w-full rounded-2xl overflow-hidden bg-card border border-border/50 text-left shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-stretch">
                        {/* Thumbnail */}
                        {course.thumbnail_url && (
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                            <img
                              src={course.thumbnail_url}
                              alt={course.course_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex-1 px-3 py-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate">
                              #{rank} · {course.course_name}
                            </p>
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-[2px] text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/60 dark:text-amber-200">
                              Top 100
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground truncate">
                            {course.sub_country && `${course.sub_country}, `}
                            {course.country}
                          </p>

                          <p className="text-[11px] text-muted-foreground">
                            Played {course.times_played} time{course.times_played === 1 ? '' : 's'} by Clbhouz members ·{' '}
                            Avg rating {course.avg_rating != null ? course.avg_rating.toFixed(1) : '–'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pager */}
              {(courseHasPrev || courseHasNext) && (
                <div className="flex justify-between pt-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!courseHasPrev}
                    onClick={() => courseHasPrev && setCoursePage((p) => p - 1)}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!courseHasNext}
                    onClick={() => courseHasNext && setCoursePage((p) => p + 1)}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Filters */}
          <section className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Select value={scope} onValueChange={handleScopeChange}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Region" />
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
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Timeframe" />
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
          </section>

          {/* Your Position Card */}
          {currentUserEntry && (
            <div className="p-4 rounded-xl bg-primary-accent/10 border border-primary-accent/20 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                YOUR POSITION
              </p>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-accent" />
                <p className="text-lg font-bold text-foreground">
                  #{currentUserEntry.rank} · {currentUserEntry.total_top100_played} Top 100 courses played
                </p>
              </div>
              {currentUserEntry.milestone_label && (
                <p className="text-sm text-muted-foreground">
                  You're currently {currentUserEntry.milestone_label}
                </p>
              )}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12 px-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive mb-3">
                Failed to load leaderboard data.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isError && allEntries.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No Top 100 rounds logged here yet.</p>
              <p className="text-sm mt-1">Be the first to start your pilgrimage.</p>
            </div>
          )}

          {/* Leaderboard List */}
          {!isError && visiblePlayers.length > 0 && (
            <>
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                PLAYERS LEADERBOARD
              </h3>
              <div className="space-y-2">
                {visiblePlayers.map((entry) => {
                  const club = getTop100Club(entry.total_top100_played);
                  const isCurrentUser = entry.user_id === currentUserEntry?.user_id;

                  return (
                    <button
                      key={entry.user_id}
                      type="button"
                      onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 flex items-center justify-between gap-3 text-left transition-shadow",
                        isCurrentUser
                          ? "border-primary-accent/60 bg-primary-accent/5 shadow-md"
                          : "border-border/60 bg-card hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "text-sm font-semibold w-7 text-left",
                            entry.rank <= 3 ? "text-primary-accent" : "text-muted-foreground"
                          )}
                        >
                          #{entry.rank}
                        </span>

                        {/* Avatar with ring */}
                        <div className="relative">
                          <div
                            className={cn(
                              "h-11 w-11 rounded-full border-2 ring-2 ring-offset-2 ring-offset-background flex items-center justify-center overflow-hidden",
                              getTop100RingBorderClass(club.tierId)
                            )}
                          >
                            {entry.avatar_url ? (
                              <img
                                src={entry.avatar_url}
                                alt={entry.display_name}
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-xs font-semibold">
                                {entry.display_name?.slice(0, 2).toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {entry.display_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {entry.home_club || entry.country || "No home club set"}
                          </p>
                          {club.tierName && (
                            <p className="text-[11px] text-primary-accent mt-0.5">
                              {club.tierName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-semibold">
                          {entry.total_top100_played}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Top 100{entry.total_top100_played === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pager */}
              {(playersHasPrev || playersHasNext) && (
                <div className="flex justify-between pt-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!playersHasPrev}
                    onClick={() => playersHasPrev && setPlayersPage((p) => p - 1)}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!playersHasNext}
                    onClick={() => playersHasNext && setPlayersPage((p) => p + 1)}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Top100LeaderboardPanel;
