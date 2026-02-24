import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Search, Award, X } from 'lucide-react';
import { Top100JourneyHero } from '@/components/top100/Top100JourneyHero';
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

type Top100SortOption = 'official' | 'user_rating';

/** Read saved Top 100 filters from sessionStorage (parsed once, shared by initialisers). */
function readSavedFilters(): { list?: string; sort?: string; searchTerm?: string } | null {
  try {
    const raw = sessionStorage.getItem('top100-last-filters');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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
  
  // State — initialised from sessionStorage when available
  const [selectedList, setSelectedList] = useState(() => {
    const saved = readSavedFilters();
    return saved?.list || 'global';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = readSavedFilters();
    return saved?.searchTerm || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<Top100SortOption>(() => {
    const saved = readSavedFilters();
    const val = saved?.sort;
    return val === 'user_rating' ? 'user_rating' : 'official';
  });

  // Scroll restoration ref
  const hasRestoredScroll = useRef(false);

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Persist filters to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('top100-last-filters', JSON.stringify({
        list: selectedList,
        sort: sortOption,
        searchTerm,
      }));
    } catch { /* ignore */ }
  }, [selectedList, sortOption, searchTerm]);

  // Fetch courses
  const { 
    data: coursesData,
    isLoading,
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten and sort courses
  const allCourses: SearchedCourseWithRating[] = React.useMemo(() => {
    const courses = coursesData?.pages.flat() ?? [];
    
    return [...courses].sort((a, b) => {
      switch (sortOption) {
        case 'user_rating':
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

  // Scroll restoration on mount (after courses load)
  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const savedScroll = sessionStorage.getItem('top100-scroll');
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem('top100-scroll');
      });
    }
  }, [allCourses.length]);

  // Save scroll position before navigating to a course detail
  const handleCourseClick = () => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem('top100-scroll', scrollY.toString());
  };

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
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

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

  return (
    <div className="space-y-3 pb-6">
      {/* Top 100 Journey Hero - Premium progress module */}
      {user && (
        <Top100JourneyHero
          completedCourses={totalRated}
          totalCourses={100}
          listCount={listsCount}
        />
      )}

      {/* Controls Section - compact spacing */}
      <section className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within this Top 100 list"
            aria-label="Search within Top 100 list"
            className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-sq-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-base focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:border-border focus-visible:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-muted-foreground hover:text-foreground active:scale-[0.9] transition-transform"
              aria-label="Clear search"
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
                className={cn(
                  'h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:border-border data-[state=open]:ring-0 transition-all duration-150 active:scale-[0.98]',
                  selectedList !== 'global' 
                    ? 'border-primary/40 ring-1 ring-primary/20 text-foreground' 
                    : 'border-border'
                )}
              >
                <SelectValue placeholder="Global Top 100" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
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
                className={cn(
                  'h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:border-border data-[state=open]:ring-0 transition-all duration-150 active:scale-[0.98]',
                  sortOption !== 'official' 
                    ? 'border-primary/40 ring-1 ring-primary/20 text-foreground' 
                    : 'border-border'
                )}
              >
                <SelectValue placeholder="Official ranking" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
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

      {/* Rankings List */}
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
      ) : allCourses.length === 0 ? (
        /* Empty state - friendly with search-specific messaging */
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-muted/50 border border-border/60 flex items-center justify-center shadow-sm">
            {searchTerm ? (
              <Search className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Award className="w-5 h-5 text-muted-foreground" />
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
              onClick={() => setSearchTerm('')}
              className="mt-1 gap-1.5 h-11 active:scale-[0.97] transition-transform"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </Button>
          ) : (
            <Button variant="outline" onClick={handleResetFilters} className="mt-1 h-11 active:scale-[0.97] transition-transform">
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <VirtualizedCourseList 
          courses={allCourses}
          onCourseClick={handleCourseClick}
        />
      )}
    </div>
  );
};

export default Top100CoursesHubPanel;
