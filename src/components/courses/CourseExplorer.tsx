import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X } from 'lucide-react';
import CourseCard from './CourseCard';
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
import { ExploreLoadMoreButton } from './ExploreLoadMoreButton';

type SortOption = 'popular' | 'rating_desc' | 'recently_added' | 'name_asc';

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
  const [sortOption, setSortOption] = useState<SortOption>('popular');

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
      // fail safe
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

  // Infinite query for load-more pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, sortOption],
    queryFn: async ({ pageParam = 0 }) => {
      if (!mountedRef.current) throw new Error('Component unmounted');
      
      try {
        let query = supabase
          .from('golf_courses')
          .select(`
            *,
            course_rating_stats(average_rating)
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
        switch (sortOption) {
          case 'rating_desc':
            query = query.order('global_rank', { ascending: true, nullsFirst: false });
            break;
          case 'recently_added':
            query = query.order('created_at', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'popular':
          default:
            query = query.order('global_rank', { ascending: true, nullsFirst: false });
            query = query.order('name', { ascending: true });
            break;
        }
        
        // Pagination
        const from = pageParam * EXPLORE_PAGE_SIZE;
        const to = from + EXPLORE_PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (!mountedRef.current) throw new Error('Component unmounted');
        
        if (error) {
          console.error('CourseExplorer query error:', error);
          throw error;
        }

        // Flatten course_rating_stats to average_rating
        const coursesWithRatings = (data || []).map(course => ({
          ...course,
          average_rating: course.course_rating_stats?.[0]?.average_rating ?? null,
        }));

        return {
          courses: coursesWithRatings,
          totalCount: count ?? 0,
          nextPage: coursesWithRatings.length === EXPLORE_PAGE_SIZE ? pageParam + 1 : undefined,
        };
      } catch (error) {
        if (!mountedRef.current) return { courses: [], totalCount: 0, nextPage: undefined };
        console.error('CourseExplorer error:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: mountedRef.current,
  });

  // Flatten all pages into single array
  const allCourses = data?.pages.flatMap(page => page.courses) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-sq-md overflow-hidden">
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  );

  const regionOptions = [
    { value: PRIMARY_REGIONS.ALL, label: PRIMARY_REGION_LABELS['all'] },
    { value: PRIMARY_REGIONS.GB_I, label: PRIMARY_REGION_LABELS['gb-i'] },
    { value: PRIMARY_REGIONS.USA, label: PRIMARY_REGION_LABELS['usa'] },
    { value: PRIMARY_REGIONS.EUROPE, label: PRIMARY_REGION_LABELS['europe'] },
    { value: PRIMARY_REGIONS.AFRICA, label: PRIMARY_REGION_LABELS['africa'] },
    { value: PRIMARY_REGIONS.REST, label: PRIMARY_REGION_LABELS['rest'] },
  ];

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
    { value: 'popular', label: 'Most popular' },
    { value: 'rating_desc', label: 'Highest rated' },
    { value: 'recently_added', label: 'Recently added' },
    { value: 'name_asc', label: 'A–Z' },
  ];

  const subregionDisabled = selectedRegion === PRIMARY_REGIONS.ALL || !SUBREGIONS[selectedRegion as Exclude<PrimaryRegionKey, 'all'>]?.length;

  return (
    <div className="w-full space-y-5">
      {/* Scroll target for state preservation */}
      <div ref={listTopRef} className="h-0" />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, county or area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-sq-sm bg-card border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border transition-shadow text-base placeholder:text-[15px]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters row - Region + Sub-region */}
      <div className="flex items-center gap-3">
        {/* Primary region */}
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value as PrimaryRegionKey);
            setSelectedSubregion('all');
          }}>
            <SelectTrigger className="h-11 w-full rounded-sq-sm bg-card border border-border/60 justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Regions" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm">
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
            disabled={subregionDisabled}
          >
            <SelectTrigger className="h-11 w-full rounded-sq-sm bg-card border border-border/60 justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder={subregionDisabled ? "Choose a region first" : "All sub-regions"} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm">
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

      {/* Context row: exploring label + sort + optional clear filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {hasSearch ? (
              <>
                Results for "{debouncedSearch}" {selectedRegion === PRIMARY_REGIONS.ALL
                  ? 'worldwide'
                  : <>in <span className="font-medium text-foreground">{getRegionLabel()}</span></>}
                {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
              </>
            ) : selectedRegion === PRIMARY_REGIONS.ALL ? (
              'Exploring all courses worldwide'
            ) : (
              <>
                Exploring courses in{' '}
                <span className="font-medium text-foreground">{getRegionLabel()}</span>
                {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
              </>
            )}
            {totalCount > 0 && !isLoading && (
              <span className="ml-1 text-muted-foreground/70">· {totalCount.toLocaleString()} results</span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline flex-shrink-0"
            >
              Clear filters
            </button>
          )}
        </div>
        <AppSelect
          value={sortOption}
          onChange={(v) => setSortOption(v as SortOption)}
          options={sortOptions}
          ariaLabel="Sort courses"
          triggerClassName="h-9"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-2">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold">No courses found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try a different search or broaden your filters.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleResetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Course cards - full width */}
          {allCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={handleCourseClick}
            />
          ))}
          
          {/* Load more button */}
          <ExploreLoadMoreButton
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            loadedCount={allCourses.length}
            totalCount={totalCount}
            pageSize={EXPLORE_PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
