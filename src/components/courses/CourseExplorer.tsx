import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, ArrowUp } from 'lucide-react';
import CourseCard from './CourseCard';
import VirtualizedCourseList from './VirtualizedCourseList';
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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { COURSES_PAGE_SIZE } from '@/config/pagination';

type SortOption = 'popular' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';

const CourseExplorer = () => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const hasInitialisedFromUrlRef = useRef(false);
  const mountedRef = useRef(true);
  
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
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [showSortSheet, setShowSortSheet] = useState(false);

  // Save filters to sessionStorage whenever they change (only after URL initialization)
  useEffect(() => {
    // Don't immediately overwrite URL-driven state on first render
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Scroll-to-top button visibility with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 600);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cleanup on unmount - clear sessionStorage to prevent stale state on revisit
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

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedRegion, selectedSubregion, debouncedSearch, sortOption]);

  // Scroll to top when page changes (for pagination buttons)
  useEffect(() => {
    if (page > 0) {
      scrollToTop();
    }
  }, [page]);

  // Fetch courses with region filtering based on country
  const { data, isLoading } = useQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, sortOption, page],
    queryFn: async () => {
      if (!mountedRef.current) throw new Error('Component unmounted');
      
      try {
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

        // Apply search filter - safer, primary name search only
        if (debouncedSearch && debouncedSearch.length >= 2) {
          query = query.ilike('name', `%${debouncedSearch}%`);
        }

        // Apply sorting
        switch (sortOption) {
          case 'rating_desc':
            query = query.order('global_rank', { ascending: true, nullsFirst: false });
            break;
          case 'rating_asc':
            query = query.order('global_rank', { ascending: false, nullsFirst: true });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          case 'popular':
          default:
            // Popular: Top 100 courses first, then alphabetically
            query = query.order('global_rank', { ascending: true, nullsFirst: false });
            query = query.order('name', { ascending: true });
            break;
        }
        
        // Pagination
        const from = page * COURSES_PAGE_SIZE;
        const to = from + COURSES_PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (!mountedRef.current) throw new Error('Component unmounted');
        
        if (error) {
          console.error('CourseExplorer query error:', error);
          throw error;
        }

        return {
          courses: data || [],
          totalCount: count ?? 0,
        };
      } catch (error) {
        if (!mountedRef.current) return { courses: [], totalCount: 0 };
        console.error('CourseExplorer error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // Reduced to 5 minutes for mobile memory
    retry: 1,
    enabled: mountedRef.current,
  });

  const courses = data?.courses || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = courses.length === COURSES_PAGE_SIZE && (page + 1) * COURSES_PAGE_SIZE < totalCount;

  // Phase 2 Perf: Import skeleton component with minimum display time
  const LoadingSkeleton = () => {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setShouldShow(true), 150);
      return () => clearTimeout(timer);
    }, []);

    if (!shouldShow) {
      return <div className="min-h-[400px]" />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  };

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

  const startIndex = totalCount === 0 ? 0 : page * COURSES_PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * COURSES_PAGE_SIZE, totalCount);
  const hasNextPage = endIndex < totalCount;

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

  const sortLabelMap: Record<SortOption, string> = {
    popular: 'Most popular',
    rating_desc: 'Highest rated',
    rating_asc: 'Lowest rated',
    name_asc: 'A–Z',
    name_desc: 'Z–A',
  };

  const handleSortSelection = (option: SortOption) => {
    setSortOption(option);
    setShowSortSheet(false);
  };

  return (
    <div className="w-full space-y-4">
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
          className="pl-10 pr-10 h-11 bg-card border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--slate-secondary)]/70 focus-visible:border-[color:var(--slate-secondary)] transition-shadow text-base placeholder:text-[15px]"
          style={{ borderRadius: 'var(--radius)' }}
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
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
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
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
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
        
        {/* Context line with sort button */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex-1">
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
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowSortSheet(true)}
              className="whitespace-nowrap"
            >
              <span className="text-muted-foreground">Sort:</span>
              <span className="text-foreground">{sortLabelMap[sortOption]}</span>
            </Button>
          </div>
        )}

          
        {/* Phase 2 Perf: Use virtualized list for better performance */}
        <VirtualizedCourseList 
          courses={courses}
          onCourseClick={handleCourseClick}
        />
          
          {/* Pagination Footer */}
          <div className="flex flex-col items-center gap-3 mt-8">
            {/* Pagination Buttons */}
            {(page > 0 || hasNextPage) && (
              <div className={`flex items-center gap-3 w-full ${page === 0 ? 'justify-center' : 'justify-between'}`}>
                {page > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={isLoading}
                  >
                    Previous {COURSES_PAGE_SIZE} courses
                  </Button>
                )}
                {hasNextPage && (
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                  >
                    Next {COURSES_PAGE_SIZE} courses
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Showing {startIndex}–{endIndex} of {totalCount.toLocaleString()} courses
            </p>
          </div>
        </div>
      )}

      {/* Sort Bottom Sheet */}
      <BottomSheet
        open={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        ariaLabelledBy="sort-options-title"
      >
        <div className="px-4 py-3">
          {(['popular', 'rating_desc', 'rating_asc', 'name_asc', 'name_desc'] as SortOption[]).map((option, index, arr) => (
            <React.Fragment key={option}>
              <button
                onClick={() => handleSortSelection(option)}
                className={`
                  w-full text-left px-4 py-3.5 transition-colors rounded-lg
                  ${sortOption === option
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {sortLabelMap[option]}
              </button>
              {index < arr.length - 1 && (
                <div className="border-t border-slate-200/40 my-0.5" />
              )}
            </React.Fragment>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default CourseExplorer;
