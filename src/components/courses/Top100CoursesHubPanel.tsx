import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { useGolfCoursesInfinite } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { getTop100Club } from '@/lib/top100Club';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Search, Award, X, ChevronDown, ChevronRight } from 'lucide-react';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import VirtualizedCourseList from './VirtualizedCourseList';
import { AppSelect, AppSelectOption } from '@/components/ui/AppSelect';
import { FLAGS } from '@/config/flags';
import {
  PRIMARY_REGIONS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
} from '@/constants/courseRegions';

const PAGE_SIZE = 10;

type Top100SortOption = 'official' | 'user_rating' | 'friends_rated';

function listSlugToRegionKey(slug: string): PrimaryRegionKey {
  switch (slug) {
    case 'gb-i':
    case 'gb-i-top100':
      return PRIMARY_REGIONS.GB_I;
    case 'usa':
    case 'usa-top100':
      return PRIMARY_REGIONS.USA;
    case 'europe':
    case 'europe-top100':
      return PRIMARY_REGIONS.EUROPE;
    case 'rest':
    case 'rest-top100':
      return PRIMARY_REGIONS.REST;
    default:
      return PRIMARY_REGIONS.ALL;
  }
}

const Top100CoursesHubPanel = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  
  // State
  const [selectedList, setSelectedList] = useState('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<Top100SortOption>('official');
  
  // Load-more pagination
  const [displayedCourses, setDisplayedCourses] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // Fetch data
  const { data: progress } = useTop100ProgressForUser(user?.id);
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: friendsData = [] } = useFriendsOnTop100Journey(user?.id);
  const { data: lists = [] } = useTop100Lists();
  
  // Mock friends for testing
  const mockFriends = FLAGS.TOP100_MOCK_FRIENDS_ENABLED ? [
    { user_id: 'mock1', profile: { display_name: 'Sarah Mitchell', username: 'sarahm', profile_photo_url: null, home_club: 'Augusta National' }, top100CoursesPlayed: 8 },
    { user_id: 'mock2', profile: { display_name: 'James Anderson', username: 'jamesA', profile_photo_url: null, home_club: 'Pebble Beach' }, top100CoursesPlayed: 12 },
    { user_id: 'mock3', profile: { display_name: 'Emma Wilson', username: 'emmaw', profile_photo_url: null, home_club: null }, top100CoursesPlayed: 5 },
    { user_id: 'mock4', profile: { display_name: 'David Chen', username: 'dchen', profile_photo_url: null, home_club: 'Royal County Down' }, top100CoursesPlayed: 15 },
    { user_id: 'mock5', profile: { display_name: 'Lisa Thompson', username: 'lisat', profile_photo_url: null, home_club: null }, top100CoursesPlayed: 7 },
  ] : [];
  
  const friends = [...friendsData, ...mockFriends];
  const hasFriends = friends.length > 0;

  // Progress calculations
  const totalRated = progress?.total_top100_rated ?? progress?.total_played_top100 ?? 0;
  const listsCount = listSummaries.filter(list => list.played_count > 0).length;
  const club = getTop100Club(totalRated);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch courses
  const { 
    data: coursesData,
    isLoading,
    fetchNextPage,
    hasNextPage: hasMorePages,
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten and sort courses
  const allCourses = React.useMemo(() => {
    const courses = coursesData?.pages.flat() ?? [];
    
    return [...courses].sort((a, b) => {
      switch (sortOption) {
        case 'user_rating':
          // Sort by any available rating if exists
          return 0; // Courses don't have user rating in this context
        case 'friends_rated':
          // Sort by friends who rated - not available in this data
          return 0;
        case 'official':
        default:
          const rankA = selectedList.includes('global') ? a.list_memberships.find((m: any) => m.list_slug.includes('global'))?.rank :
                       selectedList.includes('usa') ? a.list_memberships.find((m: any) => m.list_slug.includes('usa'))?.rank :
                       selectedList.includes('gb-i') ? a.list_memberships.find((m: any) => m.list_slug.includes('gb-i'))?.rank :
                       selectedList.includes('europe') ? a.list_memberships.find((m: any) => m.list_slug.includes('europe'))?.rank :
                       a.list_memberships[0]?.rank;
          const rankB = selectedList.includes('global') ? b.list_memberships.find((m: any) => m.list_slug.includes('global'))?.rank :
                       selectedList.includes('usa') ? b.list_memberships.find((m: any) => m.list_slug.includes('usa'))?.rank :
                       selectedList.includes('gb-i') ? b.list_memberships.find((m: any) => m.list_slug.includes('gb-i'))?.rank :
                       selectedList.includes('europe') ? b.list_memberships.find((m: any) => m.list_slug.includes('europe'))?.rank :
                       b.list_memberships[0]?.rank;
          return (rankA || 999) - (rankB || 999);
      }
    });
  }, [coursesData, sortOption, selectedList]);

  const totalCount = allCourses.length;

  // Reset displayed courses when filters change
  useEffect(() => {
    setDisplayedCourses(allCourses.slice(0, PAGE_SIZE));
    setHasReachedEnd(allCourses.length <= PAGE_SIZE);
  }, [allCourses]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (isLoadingMore || hasReachedEnd) return;
    
    setIsLoadingMore(true);
    const nextCount = displayedCourses.length + PAGE_SIZE;
    
    setTimeout(() => {
      if (nextCount >= allCourses.length) {
        setDisplayedCourses(allCourses);
        setHasReachedEnd(true);
        if (hasMorePages) fetchNextPage();
      } else {
        setDisplayedCourses(allCourses.slice(0, nextCount));
      }
      setIsLoadingMore(false);
    }, 100);
  }, [allCourses, displayedCourses.length, hasReachedEnd, isLoadingMore, hasMorePages, fetchNextPage]);

  // List options
  const listOptions = lists.length > 0 
    ? (() => {
        const transformed = lists.map(list => ({
          value: list.slug,
          label: list.short_label.includes('Top 100') ? list.short_label : `${list.short_label} Top 100`
        }));
        const desiredOrder = ['global', 'gb-i', 'usa', 'europe'];
        return transformed.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.value);
          const indexB = desiredOrder.indexOf(b.value);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
      })()
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'gb-i', label: 'Britain & Ireland Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'europe', label: 'Continental Europe Top 100' },
      ];

  const sortOptions: AppSelectOption<Top100SortOption>[] = [
    { value: 'official', label: 'Official ranking' },
    { value: 'user_rating', label: 'User rating' },
    { value: 'friends_rated', label: 'Friends rated' },
  ];

  const handleOpenTop100Club = () => {
    if (user) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  const handleOpenLeaderboard = () => {
    navigate('/top100?tab=leaderboard');
  };

  const handleResetFilters = () => {
    setSelectedList('global');
    setSearchTerm('');
    setSortOption('official');
  };

  const showLoadMoreButton = displayedCourses.length > 0 && !hasReachedEnd && displayedCourses.length < totalCount;
  const showEndMessage = hasReachedEnd && displayedCourses.length > PAGE_SIZE;

  return (
    <div className="space-y-section pb-section">
      {/* 1. Header / Identity Section */}
      <section className="text-center pt-sub">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Top 100 Club</h1>
        <p className="text-sm text-muted-foreground mt-sub">
          Your journey across the world's greatest courses
        </p>
      </section>

      {/* 2. Personal Progress Section */}
      {user && (
        <section className="space-y-3">
          {/* Progress Summary */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You've rated <span className="font-medium text-foreground">{totalRated}</span> course{totalRated === 1 ? '' : 's'} across{' '}
              <span className="font-medium text-foreground">{listsCount}</span> Top 100 list{listsCount === 1 ? '' : 's'}
            </p>
            
            {/* Progress bar - h-[5px], rounded-full, animated */}
            <div className="max-w-md mx-auto">
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-slate-200/60">
                <div
                  className="h-[5px] rounded-full bg-amber-500/90 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (totalRated / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Club Status Card - FULLY CLICKABLE */}
          <button
            type="button"
            onClick={handleOpenTop100Club}
            className="w-full rounded-sq-lg border border-border/60 bg-card shadow-sm p-3 text-left cursor-pointer hover:bg-muted/30 hover:shadow-md active:scale-[0.99] transition-all duration-150"
            aria-label="Open Top 100 Club"
            role="link"
          >
            <div className="flex gap-3 items-stretch">
              {/* Left: Badge tile - uses full AchievementBadgeCard (same as My Progress) */}
              <div className="shrink-0">
                {totalRated >= 5 ? (
                  <EliteGameCard
                    tier={club.threshold?.toString() as EliteCardTier || '5'}
                    earned={true}
                    currentProgress={totalRated}
                    targetProgress={club.threshold}
                    title={`${club.threshold} Club`}
                    subtitle={club.tierName || 'Top 100 Club'}
                    enableAnimations={false}
                    quality="medium"
                  />
                ) : (
                  <div className="h-[88px] w-[180px] rounded-sq-md bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Award className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Right: controlled flex column, text aligned right */}
              <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
                {/* Row 1: Title/Sub */}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {totalRated >= 5 ? club.tierName : 'Start your journey'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {totalRated >= 5 ? 'Unlocked' : `Rate ${5 - totalRated} more Top 100 courses to unlock`}
                  </p>
                </div>

                {/* Row 2: CTA hint pinned bottom-right */}
                <div className="flex justify-end mt-1.5">
                  <span className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    Visit Top 100 Club
                    <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-90 transition-opacity" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* 3. Social Proof - Friends on Their Journey - mt-6 spacing */}
      {user && hasFriends && (
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Friends on their Top 100 journey
            </h3>
            <button
              type="button"
              onClick={handleOpenLeaderboard}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View leaderboard →
            </button>
          </div>

          {/* Avatar row - names under avatars, fully tappable */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {friends.slice(0, 7).map((friend) => {
              const name = friend.profile.display_name || friend.profile.username || 'Golfer';
              const topCount = friend.top100CoursesPlayed ?? 0;
              
              return (
                <button
                  key={friend.user_id}
                  type="button"
                  onClick={() => navigate(`/profile/${friend.profile.username}?tab=top100`)}
                  className="flex-shrink-0 text-center w-[72px]"
                >
                  <SquircleAvatar
                    size={48}
                    src={friend.profile.profile_photo_url}
                    alt={name}
                    fallback={name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    ringColor={topCount >= 5 ? getRingColorForTotalPlayed(topCount) : undefined}
                    className="mx-auto"
                  />
                  <p className="mt-1.5 text-xs font-medium text-foreground truncate w-[72px] text-center">
                    {name.split(' ')[0]}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Controls Section - flat, no boxed container */}
      <section className="mt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within this Top 100 list"
            className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-sq-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-base focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:border-slate-300 focus-visible:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* List + Sort selectors - grid on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
          {/* List selector */}
          <div className="flex-1">
            <Select value={selectedList} onValueChange={setSelectedList}>
              <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-sq-sm text-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-slate-200/60 focus:border-slate-300 focus:outline-none">
                <SelectValue placeholder="Choose list" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 rounded-sq-sm">
                {listOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort selector */}
          <div className="flex-1">
            <AppSelect
              value={sortOption}
              onChange={(v) => setSortOption(v as Top100SortOption)}
              options={sortOptions}
              ariaLabel="Sort courses"
              triggerClassName="h-11"
            />
          </div>
        </div>
      </section>

      {/* 5. Rankings List - mt-4 from controls */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-44 w-full rounded-sq-md" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
            <Award className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">No courses match your filters</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try clearing your search or choosing a different Top 100 list.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2">
            Reset filters
          </Button>
        </div>
      ) : (
        <VirtualizedCourseList 
          courses={displayedCourses}
          onCourseClick={() => {}}
          footer={
            <>
              {/* Pagination - load more button */}
              {showLoadMoreButton && (
                <div className="flex flex-col items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full max-w-xs gap-1.5 transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        Loading next courses…
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Next {Math.min(PAGE_SIZE, totalCount - displayedCourses.length)} courses
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Showing 1–{displayedCourses.length} of {totalCount.toLocaleString()} courses
                  </p>
                </div>
              )}

              {/* End message */}
              {showEndMessage && (
                <p className="text-center text-[11px] text-muted-foreground pt-4">
                  You've reached the end • {totalCount.toLocaleString()} courses total
                </p>
              )}
            </>
          }
        />
      )}
    </div>
  );
};

export default Top100CoursesHubPanel;
