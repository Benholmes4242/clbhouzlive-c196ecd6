import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardScope, LeaderboardTimeRange, useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getTop100PrestigeRing, getRingColorClass } from '@/lib/top100Prestige';

const Top100LeaderboardPanel = () => {
  const navigate = useNavigate();
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

  // NOTE: total_count and current_user_entry come from the RPC summary,
  // which is identical for every page. It's safe to read from pages[0].
  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const totalCount = data?.pages[0]?.total_count || 0;
  const currentUserEntry = data?.pages[0]?.current_user_entry || null;

  const allCourseEntries = courseData?.pages.flatMap(page => page.entries) || [];

  // Smooth scroll on pagination
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentCount = allEntries.length;

    // Detect the moment a "next page" finishes loading
    const justFinishedNextPage =
      prevIsFetchingNextPage.current && !isFetchingNextPage;

    if (justFinishedNextPage && currentCount > prevEntriesCount.current) {
      // Nudge the scroll slightly so new rows are pulled into view
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
    <div ref={containerRef} className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
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
        <div className="inline-flex rounded-full bg-surface-alt p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewType('players')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewType === 'players'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setViewType('courses')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewType === 'courses'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Courses
          </button>
        </div>
      </div>

      {viewType === 'courses' ? (
        <div className="space-y-6">
          {/* Filters – reuse same UI as players */}
          <div className="flex flex-wrap gap-3">
            <Select value={scope} onValueChange={handleScopeChange}>
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
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
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
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
          {!isErrorCourses && allCourseEntries.length > 0 && (
            <div className="space-y-2">
              {allCourseEntries.map((course, index) => {
                const rank = index + 1;
                const location = course.sub_country
                  ? `${course.sub_country}, ${course.country ?? ''}`.trim()
                  : course.country || 'Location not set';

                return (
                  <button
                    key={course.course_id + '-' + rank}
                    onClick={() => navigate(`/courses/${course.course_id}`)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary-accent/40 hover:shadow-md transition-all text-left"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className="text-xl font-bold text-foreground">
                        #{rank}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.course_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground truncate">
                          {course.course_name}
                        </div>
                        {course.list_slug && course.list_slug !== 'worldwide' && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {listShortLabels[course.list_slug] ?? 'Top 100'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {location}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Played {course.times_played} time
                        {course.times_played === 1 ? '' : 's'} by members
                        {course.avg_rating != null && (
                          <>
                            {' · '}
                            Avg {course.avg_rating.toFixed(1)}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Load more */}
              {hasNextCoursePage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextCoursePage()}
                    disabled={isFetchingNextCoursePage}
                  >
                    {isFetchingNextCoursePage ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={scope} onValueChange={handleScopeChange}>
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
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
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
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

      {/* Your Position Card */}
      {currentUserEntry && (
        <div className="p-4 rounded-xl bg-primary-accent/10 border border-primary-accent/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Your position
          </p>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-accent" />
            <p className="text-lg font-bold text-foreground">
              #{currentUserEntry.rank} · {currentUserEntry.total_top100_played} Top 100 courses
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentUserEntry.milestone_label
              ? `You're in the ${currentUserEntry.milestone_label} – keep going.`
              : 'Log more Top 100 rounds to climb the leaderboard.'}
          </p>
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
          {!isError && allEntries.length > 0 && (
            <div className="space-y-2">
              {allEntries.map((entry) => {
                const ringColor = entry.rank <= 3 ? 'ring-primary-accent/60' : getRingColorClass(getTop100PrestigeRing(entry.total_top100_played));
                
                return (
                  <button
                    key={entry.user_id}
                    onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary-accent/40 hover:shadow-md transition-all text-left"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className={`text-xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-slate-400' :
                        entry.rank === 3 ? 'text-amber-600' :
                        'text-foreground'
                      }`}>
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Avatar + Ring */}
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name} />
                        <AvatarFallback className="bg-surface-slate text-white">
                          {(entry.display_name || 'A').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={`pointer-events-none absolute inset-0 rounded-full ring-2 ring-offset-[2px] ring-offset-background ${ringColor}`}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{entry.display_name}</p>
                        {entry.milestone_label && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-accent/10 text-primary-accent border border-primary-accent/20">
                            {entry.milestone_label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.home_club || 'No club set'}
                      </p>
                    </div>

                    {/* Count */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-foreground">{entry.total_top100_played}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        Top 100{entry.total_top100_played === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Top100LeaderboardPanel;
