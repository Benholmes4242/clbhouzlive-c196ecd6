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

type Top100SortOption = 'official' | 'user_rating';

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
          // Sort by community average rating - highest rated first, unrated last
          const ratingA = a.average_rating ?? -1;
          const ratingB = b.average_rating ?? -1;
          return ratingB - ratingA;
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

  // TODO: Add 'friends_rated' sort option when friends rating data is available
  const sortOptions: AppSelectOption<Top100SortOption>[] = [
    { value: 'official', label: 'Official ranking' },
    { value: 'user_rating', label: 'User rating' },
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
    <div className="space-y-section pb-6">
      {/* 1. Header / Identity Section */}
      <section className="text-center pt-sub">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Top 100 Club</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
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
            
            {/* Progress bar - premium animated gradient */}
            <div className="max-w-md mx-auto">
              <div 
                role="progressbar"
                aria-valuenow={Math.min(100, Math.round((totalRated / 100) * 100))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Top 100 progress: ${totalRated} courses rated`}
                className="h-[6px] w-full overflow-hidden rounded-full bg-gradient-to-r from-slate-200/80 to-slate-200/60 shadow-inner"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all duration-700 ease-out animate-fade-in"
                  style={{ width: `${Math.min(100, (totalRated / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Club Status Card - FULLY CLICKABLE with polished hover state */}
          <button
            type="button"
            onClick={handleOpenTop100Club}
            className="w-full rounded-sq-lg border border-border/60 bg-card shadow-sm p-3 text-left cursor-pointer hover:bg-muted/30 hover:shadow-md hover:border-border active:scale-[0.99] transition-all duration-200"
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
                    minimalBadgeOnly
                  />
                ) : (
                  /* Empty state - inviting gradient placeholder */
                  <div className="h-[88px] w-[180px] rounded-sq-md bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border border-dashed border-slate-300/60 flex flex-col items-center justify-center gap-1.5 transition-colors group-hover:border-slate-400/60">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-amber-500/70" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">Your badge awaits</span>
                  </div>
                )}
              </div>

              {/* Right: controlled flex column, text aligned right */}
              <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
                {/* Row 1: Title/Sub */}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground line-clamp-1">
                    {totalRated >= 5 ? club.tierName : 'Start your journey'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
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
            aria-label="Search within Top 100 list"
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

        {/* List + Sort selectors - matching Explore page exactly */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
          {/* List selector */}
          <div className="flex-1">
            <Select value={selectedList} onValueChange={setSelectedList}>
              <SelectTrigger 
                aria-label="Select Top 100 list" 
                className={`h-11 w-full rounded-sq-sm bg-white justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:border-slate-300 data-[state=open]:ring-0 transition-all duration-150 ${
                  selectedList !== 'global' 
                    ? 'border-primary/40 ring-1 ring-primary/20 text-foreground' 
                    : 'border-slate-200'
                }`}
              >
                <SelectValue placeholder="Global Top 100" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
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
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as Top100SortOption)}>
              <SelectTrigger 
                aria-label="Sort courses" 
                className={`h-11 w-full rounded-sq-sm bg-white justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:border-slate-300 data-[state=open]:ring-0 transition-all duration-150 ${
                  sortOption !== 'official' 
                    ? 'border-primary/40 ring-1 ring-primary/20 text-foreground' 
                    : 'border-slate-200'
                }`}
              >
                <SelectValue placeholder="Official ranking" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 5. Rankings List - mt-4 from controls */}
      {isLoading ? (
        /* Premium skeleton loading state */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 p-3 rounded-sq-md bg-card border border-border/40">
              <Skeleton className="h-40 w-full rounded-sq-sm" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedCourses.length === 0 ? (
        /* Empty state - friendly with search-specific messaging */
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 flex items-center justify-center shadow-sm">
            {searchTerm ? (
              <Search className="w-5 h-5 text-slate-400" />
            ) : (
              <Award className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {searchTerm ? 'No courses found' : 'No courses match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchTerm 
                ? `No courses matching "${searchTerm}" in this Top 100 list.`
                : 'Try choosing a different Top 100 list.'}
            </p>
          </div>
          {searchTerm ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchTerm('')}
              className="mt-1 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-1">
              Reset filters
            </Button>
          )}
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
                    className="w-full max-w-xs gap-1.5 transition-all duration-200 hover:shadow-sm hover:border-border active:scale-[0.98]"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Next {Math.min(PAGE_SIZE, totalCount - displayedCourses.length)} courses
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing 1–{displayedCourses.length} of {totalCount.toLocaleString()} courses
                  </p>
                </div>
              )}

              {/* End message with proper bottom spacing */}
              {showEndMessage && (
                <p className="text-center text-sm text-muted-foreground pt-4 pb-6">
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
