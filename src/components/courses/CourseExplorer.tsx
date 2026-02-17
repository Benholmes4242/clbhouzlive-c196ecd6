import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, ChevronDown } from 'lucide-react';
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

const CourseExplorer = () => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const hasInitialisedFromUrlRef = useRef(false);
  const mountedRef = useRef(true);
  
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
      } catch (e) {
        console.error('Failed to parse explore filters:', e);
      }
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
      } catch (e) {
        console.error('Failed to parse explore filters:', e);
      }
    }
    
    return 'all';
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.searchTerm || '';
    }
    return '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<SortOption>('official_rating');
  
  // Load-more pagination state
  const [displayedCourses, setDisplayedCourses] = useState<any[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (!hasInitialisedFromUrlRef.current || !mountedRef.current) return;

    try {
      sessionStorage.setItem('explore-last-filters', JSON.stringify({
        region: selectedRegion,
        subregion: selectedSubregion,
        searchTerm,
      }));
    } catch {
      // fail safe – ignore storage errors
    }
  }, [selectedRegion, selectedSubregion, searchTerm]);

  // Restore scroll position when returning from course detail
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('explore-scroll');
    if (savedScroll) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
        sessionStorage.removeItem('explore-scroll');
      });
    }
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        sessionStorage.removeItem('explore-scroll');
        sessionStorage.removeItem('explore-last-filters');
      } catch (e) {
        console.error('Failed to clear explore storage:', e);
      }
    };
  }, []);

  // Reset displayed courses when filters change
  useEffect(() => {
    setDisplayedCourses([]);
    setCurrentOffset(0);
    setHasReachedEnd(false);
  }, [selectedRegion, selectedSubregion, debouncedSearch, sortOption]);

  // Fetch initial courses
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, sortOption, 0],
    // PERF-TUNING OVERRIDE: ratings need to be fresh when returning to Explore
    refetchOnMount: 'always',
    queryFn: async () => {
      if (!mountedRef.current) throw new Error('Component unmounted');
      
      try {
        let query = supabase
          .from('golf_courses')
          .select(`
            *,
            course_rating_aggregates(avg_overall_score)
          `, { count: 'exact' });

        // Apply region filter
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

        // Apply search filter
        if (debouncedSearch && debouncedSearch.length >= 2) {
          query = query.ilike('name', `%${debouncedSearch}%`);
        }

        // Apply sorting
        query = applySortToQuery(query, sortOption);
        
        // Get first page
        query = query.range(0, EXPLORE_PAGE_SIZE - 1);

        const { data, error, count } = await query;
        
        if (!mountedRef.current) throw new Error('Component unmounted');
        
        if (error) {
          console.error('CourseExplorer query error:', error);
          throw error;
        }

        const coursesWithRatings = (data || []).map(course => ({
          ...course,
          average_rating: course.course_rating_aggregates?.[0]?.avg_overall_score ?? null,
        }));

        return {
          courses: coursesWithRatings,
          totalCount: count ?? 0,
        };
      } catch (error) {
        if (!mountedRef.current) return { courses: [], totalCount: 0 };
        console.error('CourseExplorer error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    enabled: mountedRef.current,
  });

  // Update displayed courses when initial data loads
  useEffect(() => {
    if (data?.courses && currentOffset === 0) {
      setDisplayedCourses(data.courses);
      setHasReachedEnd(data.courses.length < EXPLORE_PAGE_SIZE || data.courses.length >= (data.totalCount || 0));
    }
  }, [data, currentOffset]);

  const totalCount = data?.totalCount || 0;

  // Load more function
  const loadMore = async () => {
    if (isLoadingMore || hasReachedEnd) return;
    
    setIsLoadingMore(true);
    const nextOffset = displayedCourses.length;
    
    try {
      let query = supabase
        .from('golf_courses')
        .select(`
          *,
          course_rating_aggregates(avg_overall_score)
        `);

      // Apply same filters
      if (selectedRegion !== PRIMARY_REGIONS.ALL) {
        const dbRegion = regionKeyToDbValue(selectedRegion);
        if (dbRegion) {
          query = query.eq('country', dbRegion);
        }
      }

      if (selectedSubregion !== 'all') {
        const label = subregionKeyToLabel(selectedRegion, selectedSubregion);
        query = query.eq('sub_country', label);
      }

      if (debouncedSearch && debouncedSearch.length >= 2) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }

      // Apply same sorting
      query = applySortToQuery(query, sortOption);
      
      query = query.range(nextOffset, nextOffset + EXPLORE_PAGE_SIZE - 1);

      const { data: newData, error } = await query;
      
      if (error) throw error;

      const newCourses = (newData || []).map(course => ({
        ...course,
        average_rating: course.course_rating_aggregates?.[0]?.avg_overall_score ?? null,
      }));

      setDisplayedCourses(prev => [...prev, ...newCourses]);
      setCurrentOffset(nextOffset);
      
      if (newCourses.length < EXPLORE_PAGE_SIZE) {
        setHasReachedEnd(true);
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Skeleton loading component with shimmer effect
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

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-10 h-10 rounded-full border border-dashed border-destructive/40 flex items-center justify-center text-destructive mb-1">
        <X className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold">Unable to load courses</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        We couldn't fetch the courses. Please check your connection and try again.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 gap-1.5"
        onClick={() => refetch()}
      >
        <ChevronDown className="h-4 w-4 rotate-180" />
        Retry
      </Button>
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
    sessionStorage.setItem('explore-scroll', window.scrollY.toString());
  };

  const sortOptions: AppSelectOption<SortOption>[] = [
    { value: 'official_rating', label: 'Official Rating' },
    { value: 'community_rating', label: 'Community Rating' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'name_asc', label: 'A – Z' },
    { value: 'name_desc', label: 'Z – A' },
  ];

  const showLoadMoreButton = displayedCourses.length > 0 && !hasReachedEnd && displayedCourses.length < totalCount;
  const showEndMessage = hasReachedEnd && displayedCourses.length > 0 && totalCount > EXPLORE_PAGE_SIZE;

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
      ) : isError ? (
        <ErrorState />
      ) : displayedCourses.length === 0 ? (
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
        <VirtualizedCourseList 
          courses={displayedCourses}
          onCourseClick={handleCourseClick}
          footer={
            <>
              {/* Load more button */}
              {showLoadMoreButton && (
                <div className="flex flex-col items-center gap-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full max-w-xs h-11 gap-1.5 transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        Loading next courses…
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Next {Math.min(EXPLORE_PAGE_SIZE, totalCount - displayedCourses.length)} courses
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1 pb-6">
                    Showing 1–{displayedCourses.length} of {totalCount.toLocaleString()} courses
                  </p>
                </div>
              )}

              {/* End message */}
              {showEndMessage && (
                <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
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

export default CourseExplorer;
