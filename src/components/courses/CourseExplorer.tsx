import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, ChevronDown, RefreshCw } from 'lucide-react';
import VirtualizedCourseList from './VirtualizedCourseList';
import { YourNetworkSection } from './network';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';
import {
  PRIMARY_REGIONS,
  PRIMARY_REGION_LABELS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
  regionKeyToDbValue,
  subregionKeyToLabel,
} from '@/constants/courseRegions';
import { AppSelect, AppSelectOption } from '@/components/ui/AppSelect';
import { EXPLORE_PAGE_SIZE } from '@/config/pagination';

type SortOption = 'official_rating' | 'community_rating' | 'recently_added' | 'name_asc' | 'name_desc';

/** Apply the current sort option to a Supabase query builder. */
function applySortToQuery(query: any, sortOption: SortOption) {
  switch (sortOption) {
    case 'community_rating':
      query = query.order('avg_overall_score', { referencedTable: 'course_rating_aggregates', ascending: false, nullsFirst: false });
      query = query.order('name', { ascending: true });
      break;
    case 'recently_added':
      query = query.order('created_at', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
    case 'official_rating':
    default:
      query = query.order('global_rank', { ascending: true, nullsFirst: false });
      query = query.order('name', { ascending: true });
      break;
  }
  return query;
}

interface FetchCoursePageParams {
  selectedRegion: PrimaryRegionKey;
  selectedSubregion: string;
  debouncedSearch: string;
  sortOption: SortOption;
  offset: number;
}

/** Single query builder – eliminates duplication between initial fetch and loadMore */
async function fetchCoursePage({ selectedRegion, selectedSubregion, debouncedSearch, sortOption, offset }: FetchCoursePageParams) {
  const isFirstPage = offset === 0;

  let query = supabase
    .from('golf_courses')
    .select(
      `*, course_rating_aggregates(avg_overall_score)`,
      isFirstPage ? { count: 'exact' } : undefined,
    );

  // Region filter
  if (selectedRegion !== PRIMARY_REGIONS.ALL) {
    const dbRegion = regionKeyToDbValue(selectedRegion);
    if (dbRegion) {
      query = query.eq('country', dbRegion);
    }
  }

  // Sub-region filter
  if (selectedSubregion !== 'all') {
    const label = subregionKeyToLabel(selectedRegion, selectedSubregion);
    query = query.eq('sub_country', label);
  }

  // Search filter
  if (debouncedSearch && debouncedSearch.length >= 2) {
    query = query.ilike('name', `%${debouncedSearch}%`);
  }

  // Sorting
  query = applySortToQuery(query, sortOption);

  // Pagination range
  query = query.range(offset, offset + EXPLORE_PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('CourseExplorer query error:', error);
    throw error;
  }

  const courses = (data || []).map((course: any) => ({
    ...course,
    average_rating: course.course_rating_aggregates?.[0]?.avg_overall_score ?? null,
  }));

  return {
    courses,
    totalCount: isFirstPage ? (count ?? 0) : null,
  };
}

const CourseExplorer = () => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const hasInitialisedFromUrlRef = useRef(false);

  // URL params take priority, then sessionStorage, then defaults
  const [selectedRegion, setSelectedRegion] = useState<PrimaryRegionKey>(() => {
    const urlRegion = searchParams.get('region');
    if (urlRegion) {
      hasInitialisedFromUrlRef.current = true;
      return urlRegion as PrimaryRegionKey;
    }
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) return parsed.region;
      } catch (e) { /* ignore */ }
    }
    return PRIMARY_REGIONS.ALL;
  });

  const [selectedSubregion, setSelectedSubregion] = useState(() => {
    const urlSub = searchParams.get('sub');
    if (urlSub) {
      hasInitialisedFromUrlRef.current = true;
      return urlSub;
    }
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subregion) return parsed.subregion;
      } catch (e) { /* ignore */ }
    }
    return 'all';
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try { return JSON.parse(saved).searchTerm || ''; } catch { return ''; }
    }
    return '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<SortOption>('official_rating');

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (!hasInitialisedFromUrlRef.current) return;
    try {
      sessionStorage.setItem('explore-last-filters', JSON.stringify({
        region: selectedRegion,
        subregion: selectedSubregion,
        searchTerm,
      }));
    } catch { /* ignore */ }
  }, [selectedRegion, selectedSubregion, searchTerm]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // (Cleanup removed — explore-scroll is self-cleaning after restore,
  //  explore-last-filters must persist across unmounts/tab switches)

  // ─── useInfiniteQuery ─────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, sortOption],
    queryFn: ({ pageParam = 0 }) =>
      fetchCoursePage({
        selectedRegion,
        selectedSubregion,
        debouncedSearch,
        sortOption,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.courses.length < EXPLORE_PAGE_SIZE) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.courses.length, 0);
      // If we know the total count from page 1 and we've loaded everything, stop
      const totalCount = allPages[0]?.totalCount;
      if (totalCount != null && totalLoaded >= totalCount) return undefined;
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    retry: 2,
  });

  // Derived state (memoised to preserve reference for React.memo on VirtualizedCourseList)
  const allCourses = useMemo(
    () => data?.pages.flatMap((page) => page.courses) ?? [],
    [data?.pages],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // ─── Scroll restoration ──────────────────────────────────────────
  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const savedScroll = sessionStorage.getItem('explore-scroll');
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const scrollTarget = parseInt(savedScroll);
        const rootEl = document.getElementById('root');
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem('explore-scroll');
      });
    }
  }, [allCourses.length]);

  // ─── Intersection Observer (sentinel) ─────────────────────────────
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // ─── Skeleton loading (initial full page) ────────────────────────
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3 animate-pulse">
          <Skeleton className="h-48 w-full rounded-sq-sm bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
          <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      ))}
    </div>
  );

  // ─── Inline skeleton cards for infinite scroll loading ───────────
  const InlineLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6 animate-in fade-in duration-150">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card sm:border sm:border-border/60 sm:rounded-sq-md overflow-hidden">
          <Skeleton className="w-full aspect-[16/9] rounded-none" />
          <div className="px-4 py-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Error state (initial load) ──────────────────────────────────
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-10 h-10 rounded-full border border-dashed border-destructive/40 flex items-center justify-center text-destructive mb-1">
        <X className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold">Unable to load courses</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        We couldn't fetch the courses. Please check your connection and try again.
      </p>
      <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => refetch()}>
        <ChevronDown className="h-4 w-4 rotate-180" />
        Retry
      </Button>
    </div>
  );

  // ─── Inline retry card (pagination fetch failure) ────────────────
  const InlineRetryCard = () => (
    <div className="max-w-md mx-auto mt-4">
      <button
        onClick={() => fetchNextPage()}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-sq-sm bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors active:scale-[0.98]"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Couldn't load more courses · Tap to retry
      </button>
    </div>
  );

  const regionOptions = Object.entries(PRIMARY_REGION_LABELS).map(([key, label]) => ({
    value: key as PrimaryRegionKey,
    label,
  }));

  const getRegionLabel = () => {
    if (selectedRegion === PRIMARY_REGIONS.ALL) return 'worldwide';
    return regionOptions.find((o) => o.value === selectedRegion)?.label || 'this region';
  };

  const hasSearch = debouncedSearch.trim().length > 0;
  const hasActiveFilters = selectedRegion !== PRIMARY_REGIONS.ALL || selectedSubregion !== 'all' || hasSearch;

  const handleResetFilters = () => {
    setSelectedRegion(PRIMARY_REGIONS.ALL);
    setSelectedSubregion('all');
    setSearchTerm('');
    sessionStorage.setItem('explore-last-filters', JSON.stringify({
      region: PRIMARY_REGIONS.ALL,
      subregion: 'all',
      searchTerm: '',
    }));
  };

  // Capture scroll position when clicking a course card
  const handleCourseClick = () => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem('explore-scroll', scrollY.toString());
  };

  const sortOptions: AppSelectOption<SortOption>[] = [
    { value: 'official_rating', label: 'Official Rating' },
    { value: 'community_rating', label: 'Community Rating' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'name_asc', label: 'A – Z' },
    { value: 'name_desc', label: 'Z – A' },
  ];


  return (
    <div className="w-full space-y-block pb-28">
      {/* Your Network Section - Shows activity from friends */}
      <YourNetworkSection className="mt-2" />

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" aria-hidden="true" />
        <Input
          placeholder="Search by name, county or area…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-sq-sm bg-card border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:border-border transition-all duration-150 text-base placeholder:text-[15px]"
          aria-label="Search golf courses"
          role="searchbox"
        />
        {isFetching && searchTerm && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2" aria-label="Searching">
            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Region + sub-region filters */}
      <div className="max-w-xl mx-auto flex items-center justify-center gap-3" role="group" aria-label="Course filters">
        {/* Primary region */}
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value as PrimaryRegionKey);
            setSelectedSubregion('all');
          }}>
            <SelectTrigger 
              className={`h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:border-border data-[state=open]:ring-0 transition-all duration-150 active:scale-[0.98] ${
                selectedRegion !== PRIMARY_REGIONS.ALL 
                  ? 'border-border ring-1 ring-border text-foreground' 
                  : 'border-border'
              }`}
              aria-label="Select region"
            >
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder="All Regions" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
              {regionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-region */}
        <div className="flex-1">
          <Select
            value={selectedSubregion}
            onValueChange={setSelectedSubregion}
            disabled={selectedRegion === PRIMARY_REGIONS.ALL || !SUBREGIONS[selectedRegion as Exclude<PrimaryRegionKey, 'all'>]?.length}
          >
            <SelectTrigger 
              className={`h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:border-border data-[state=open]:ring-0 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedSubregion !== 'all' 
                  ? 'border-border ring-1 ring-border text-foreground' 
                  : 'border-border'
              }`}
              aria-label="Select sub-region"
            >
              <SelectValue placeholder={selectedRegion === PRIMARY_REGIONS.ALL ? "Choose a region first" : "All sub-regions"} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <SelectItem value="all">All sub-regions</SelectItem>
              {selectedRegion !== PRIMARY_REGIONS.ALL && SUBREGIONS[selectedRegion as Exclude<PrimaryRegionKey, 'all'>]?.map((s) => (
                <SelectItem key={s} value={normalizeLabel(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Context row with sort */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground flex-1">
            {hasSearch ? (
              <>
                Results for "{debouncedSearch}" {selectedRegion === PRIMARY_REGIONS.ALL
                  ? 'worldwide'
                  : <>in <span className="font-medium text-foreground/90">{getRegionLabel()}</span></>}
                {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground/90">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
              </>
            ) : selectedRegion === PRIMARY_REGIONS.ALL ? (
              'Exploring all courses worldwide'
            ) : (
              <>
                Exploring courses in{' '}
                <span className="font-medium text-foreground/90">{getRegionLabel()}</span>
                {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground/90">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
              </>
            )}
          </p>
          <AppSelect
            value={sortOption}
            onChange={(v) => setSortOption(v as SortOption)}
            options={sortOptions}
            ariaLabel="Sort courses"
            triggerClassName="h-11 text-[11px] active:scale-[0.98]"
          />
        </div>
      )}

      {/* Results */}
      <div ref={listTopRef} />
      
      {isLoading ? (
        <LoadingSkeleton />
      ) : (isError && allCourses.length === 0) ? (
        <ErrorState />
      ) : allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">No courses found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try a different search or broaden your filters.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={handleResetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <VirtualizedCourseList 
            courses={allCourses}
            onCourseClick={handleCourseClick}
          />

          {/* Sentinel + loading skeletons */}
          {hasNextPage && !isError && (
            <div ref={sentinelRef} className="w-full">
              {isFetchingNextPage && <InlineLoadingSkeleton />}
            </div>
          )}

          {/* Inline retry on pagination error */}
          {isError && !isFetchingNextPage && allCourses.length > 0 && (
            <InlineRetryCard />
          )}

          {/* Loading indicator during retry */}
          {isError && isFetchingNextPage && allCourses.length > 0 && (
            <InlineLoadingSkeleton />
          )}
        </>
      )}
    </div>
  );
};

export default CourseExplorer;
