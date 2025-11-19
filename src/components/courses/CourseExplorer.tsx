import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, ArrowUp } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PRIMARY_REGIONS,
  PRIMARY_REGION_LABELS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
  regionKeyToDbValue,
  subregionKeyToLabel,
} from '@/constants/courseRegions';

const REGION_STORAGE_KEY = 'clbhouz_courses_region_v1';
const SUBREGION_STORAGE_KEY = 'clbhouz_courses_subregion_v1';

function getInitialRegion(): { value: PrimaryRegionKey; auto: boolean } {
  // 1) URL param has priority
  const params = new URLSearchParams(window.location.search);
  const urlRegion = params.get('region') as PrimaryRegionKey;
  if (urlRegion && Object.values(PRIMARY_REGIONS).includes(urlRegion)) {
    return { value: urlRegion, auto: false };
  }

  // 2) Local storage from previous visit
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(REGION_STORAGE_KEY) as PrimaryRegionKey;
    if (stored && Object.values(PRIMARY_REGIONS).includes(stored)) {
      return { value: stored, auto: false };
    }
  }

  // 3) Very light heuristic based on browser locale
  let autoRegion: PrimaryRegionKey = PRIMARY_REGIONS.ALL;
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en-gb') || lang.startsWith('en-ie')) {
      autoRegion = PRIMARY_REGIONS.GB_I;
    } else if (lang.startsWith('en-us')) {
      autoRegion = PRIMARY_REGIONS.USA;
    }
  }

  return { value: autoRegion, auto: autoRegion !== PRIMARY_REGIONS.ALL };
}

const PAGE_SIZE = 50;

const CourseExplorer = () => {
  const initialRegion = getInitialRegion();
  const [selectedRegion, setSelectedRegion] = useState(initialRegion.value);
  const [regionWasAuto, setRegionWasAuto] = useState(initialRegion.auto);
  const [selectedSubregion, setSelectedSubregion] = useState('all');
  const [page, setPage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Initialize search from URL if present
  const urlQuery = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('query') || '' 
    : '';
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQuery);

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

  // Restore subregion from URL/storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const urlSub = url.searchParams.get('sub');

    if (urlSub) {
      setSelectedSubregion(urlSub);
      return;
    }

    const stored = window.localStorage.getItem(SUBREGION_STORAGE_KEY);
    if (stored) {
      setSelectedSubregion(stored);
    }
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedRegion, selectedSubregion, debouncedSearch]);

  // Persist region selection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // localStorage
    window.localStorage.setItem(REGION_STORAGE_KEY, selectedRegion);

    // keep URL in sync (non-destructive)
    const url = new URL(window.location.href);
    url.searchParams.set('region', selectedRegion);
    window.history.replaceState({}, '', url.toString());
  }, [selectedRegion]);

  // Persist sub-region to URL + storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(SUBREGION_STORAGE_KEY, selectedSubregion);

    const url = new URL(window.location.href);
    if (selectedSubregion && selectedSubregion !== 'all') {
      url.searchParams.set('sub', selectedSubregion);
    } else {
      url.searchParams.delete('sub');
    }

    window.history.replaceState({}, '', url.toString());
  }, [selectedSubregion]);

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
    setRegionWasAuto(false);
    setSearchTerm('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('region');
      url.searchParams.delete('sub');
      url.searchParams.delete('query');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="space-y-4">
      {/* Scroll to top button */}
      {/* Search */}
      <div className="relative mx-auto mt-4 w-full max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, county or area..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);

            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              if (value) {
                url.searchParams.set('query', value);
              } else {
                url.searchParams.delete('query');
              }
              window.history.replaceState({}, '', url.toString());
            }
          }}
          className="pl-10 pr-10 h-11 bg-card border-border/50 rounded-xl shadow-sm focus:shadow-md transition-shadow text-sm"
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
      <div className="mx-auto mt-3 flex w-full max-w-xl gap-2">
        {/* Primary region */}
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value as PrimaryRegionKey);
            setSelectedSubregion('all');
            setRegionWasAuto(false);
          }}>
            <SelectTrigger className="w-full h-11 rounded-xl bg-card border-border/50">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select region" />
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
            <SelectTrigger className="w-full h-11 rounded-xl bg-card border-border/50">
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
        {/* Compact meta info block: region + range on left, reset on right */}
        {totalCount > 0 && (
          <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <div>
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
              </div>
              <div className="text-[11px] text-muted-foreground/80">
                {totalCount <= PAGE_SIZE && page === 0 ? (
                  <>Showing all {totalCount} course{totalCount !== 1 && 's'}</>
                ) : (
                  <>Showing {startIndex}–{endIndex} of {totalCount.toLocaleString()} courses</>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 inline-flex items-center text-[11px] font-medium text-muted-foreground hover:text-foreground sm:mt-0"
              >
                ✕&nbsp;Reset filters
              </button>
            )}
          </div>
        )}
          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
              {courses.map((course) => (
                <div key={course.id} className="mb-4 sm:mb-0">
                  <CourseCard 
                    course={course}
                    showRankBadge={!!course.global_rank}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination Controls */}
          {hasMore && (
            <div className="flex justify-center mt-8 mb-8">
              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl"
              >
                Load next {PAGE_SIZE} courses
              </Button>
            </div>
          )}
          
          {page > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setPage(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Back to first page
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
