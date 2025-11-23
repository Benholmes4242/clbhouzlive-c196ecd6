import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, ArrowUp } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { scrollToTop } from '@/utils/scrollToTop';
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

const PAGE_SIZE = 50;

const CourseExplorer = () => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const hasInitialisedFromUrlRef = useRef(false);
  
  // URL params take priority, then sessionStorage, then defaults
  const [selectedRegion, setSelectedRegion] = useState<PrimaryRegionKey>(() => {
    // 1. Check URL first
    const urlRegion = searchParams.get('region');
    if (urlRegion) {
      hasInitialisedFromUrlRef.current = true;
      return urlRegion as PrimaryRegionKey;
    }
    
    // 2. Fall back to sessionStorage
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) return parsed.region;
      } catch (e) {
        console.error('Failed to parse explore filters:', e);
      }
    }
    
    // 3. Default
    return PRIMARY_REGIONS.ALL;
  });
  
  const [selectedSubregion, setSelectedSubregion] = useState(() => {
    // 1. Check URL first
    const urlSub = searchParams.get('sub');
    if (urlSub) {
      hasInitialisedFromUrlRef.current = true;
      return urlSub;
    }
    
    // 2. Fall back to sessionStorage
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subregion) return parsed.subregion;
      } catch (e) {
        console.error('Failed to parse explore filters:', e);
      }
    }
    
    // 3. Default
    return 'all';
  });
  const [page, setPage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.searchTerm || '';
    }
    return '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Save filters to sessionStorage whenever they change (only after URL initialization)
  useEffect(() => {
    // Don't immediately overwrite URL-driven state on first render
    if (!hasInitialisedFromUrlRef.current) return;

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedRegion, selectedSubregion, debouncedSearch]);

  // Scroll to top when page changes (for pagination buttons)
  useEffect(() => {
    if (page > 0) {
      scrollToTop();
    }
  }, [page]);

  // Fetch courses with region filtering based on country
  const { data, isLoading } = useQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, page],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*', { count: 'exact' });

      // Apply region filter based on country
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

      // Apply search filter - include local_area
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,country.ilike.%${debouncedSearch}%,sub_country.ilike.%${debouncedSearch}%`);
      }

      // Order by global rank first (Top 100 courses), then alphabetically
      query = query.order('global_rank', { ascending: true, nullsFirst: false });
      query = query.order('name', { ascending: true });
      
      // Pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        courses: data || [],
        totalCount: count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const courses = data?.courses || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = courses.length === PAGE_SIZE && (page + 1) * PAGE_SIZE < totalCount;

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const regionOptions = [
    { value: PRIMARY_REGIONS.ALL, label: PRIMARY_REGION_LABELS['all'] },
    { value: PRIMARY_REGIONS.GB_I, label: PRIMARY_REGION_LABELS['gb-i'] },
    { value: PRIMARY_REGIONS.USA, label: PRIMARY_REGION_LABELS['usa'] },
    { value: PRIMARY_REGIONS.EUROPE, label: PRIMARY_REGION_LABELS['europe'] },
    { value: PRIMARY_REGIONS.REST, label: PRIMARY_REGION_LABELS['rest'] },
  ];

  const getRegionLabel = () => {
    if (selectedRegion === PRIMARY_REGIONS.ALL) return 'worldwide';
    return regionOptions.find((o) => o.value === selectedRegion)?.label || 'this region';
  };

  const hasSearch = debouncedSearch.trim().length > 0;
  const hasActiveFilters = selectedRegion !== PRIMARY_REGIONS.ALL || selectedSubregion !== 'all' || hasSearch;

  const startIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const handleResetFilters = () => {
    setSelectedRegion(PRIMARY_REGIONS.ALL);
    setSelectedSubregion('all');
    setSearchTerm('');
    setPage(0);
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

  return (
    <div className="mt-4 space-y-4 max-w-2xl mx-auto px-4 pb-6">
      {/* Scroll to top button */}
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, county or area..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border transition-shadow text-base placeholder:text-[15px]"
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

      {/* Region + sub-region filters */}
      <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
        {/* Primary region */}
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value as PrimaryRegionKey);
            setSelectedSubregion('all');
          }}>
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select region" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {regionOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                >
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
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
              <SelectValue placeholder="All sub-regions" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
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

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">No courses match your filters</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try clearing filters or searching for a different course name or
            location.
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
        <div className="space-y-6">
        {/* Scroll target for pagination */}
        <div ref={listTopRef} className="h-0" />
        
        {/* Compact meta info block: region + range on left, reset on right */}
        {totalCount > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-sm md:text-base text-muted-foreground">
              {hasSearch ? (
                <>
                  Results for "{debouncedSearch}" {selectedRegion === PRIMARY_REGIONS.ALL
                    ? 'worldwide'
                    : <>in <span className="font-medium text-foreground">{getRegionLabel()}</span></>}
                  {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
                </>
              ) : selectedRegion === PRIMARY_REGIONS.ALL ? (
                'Showing all courses worldwide'
              ) : (
                <>
                  Showing courses in{' '}
                  <span className="font-medium text-foreground">{getRegionLabel()}</span>
                  {selectedSubregion !== 'all' && <> → <span className="font-medium text-foreground">{subregionKeyToLabel(selectedRegion, selectedSubregion)}</span></>}
                </>
              )}
            </p>
            <div className="flex items-center justify-between text-sm md:text-base text-muted-foreground">
              <span>
                {totalCount <= PAGE_SIZE && page === 0 ? (
                  <>Showing all {totalCount} course{totalCount !== 1 && 's'}</>
                ) : (
                  <>Showing {startIndex}–{endIndex} of {totalCount.toLocaleString()} courses</>
                )}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 text-sm md:text-base"
                >
                  <span className="text-[10px] leading-none">&times;</span>
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          </div>
        )}
          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
              {courses.map((course) => (
                <div key={course.id} className="mb-4 sm:mb-0">
                  <CourseCard 
                    course={course}
                    showRankBadge={!!course.global_rank}
                    onClick={handleCourseClick}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-3 mt-6 mb-0">
            {page > 0 && (
              <Button
                variant="outline"
                onClick={() => setPage((p) => p - 1)}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl"
              >
                Previous {PAGE_SIZE} courses
              </Button>
            )}
            {hasMore && (
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl"
              >
                Next {PAGE_SIZE} courses
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
