import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

const REGION_STORAGE_KEY = 'clbhouz_courses_region_v1';

function getInitialRegion(): { value: string; auto: boolean } {
  // 1) URL param has priority
  const params = new URLSearchParams(window.location.search);
  const urlRegion = params.get('region');
  if (urlRegion && ['all', 'gb-i', 'usa', 'europe', 'rest'].includes(urlRegion)) {
    return { value: urlRegion, auto: false };
  }

  // 2) Local storage from previous visit
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(REGION_STORAGE_KEY);
    if (stored && ['all', 'gb-i', 'usa', 'europe', 'rest'].includes(stored)) {
      return { value: stored, auto: false };
    }
  }

  // 3) Very light heuristic based on browser locale
  let autoRegion: string = 'all';
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en-gb') || lang.startsWith('en-ie')) {
      autoRegion = 'gb-i';
    } else if (lang.startsWith('en-us')) {
      autoRegion = 'usa';
    }
  }

  return { value: autoRegion, auto: autoRegion !== 'all' };
}

const CourseExplorer = () => {
  const initialRegion = getInitialRegion();
  const [selectedRegion, setSelectedRegion] = useState(initialRegion.value);
  const [regionWasAuto, setRegionWasAuto] = useState(initialRegion.auto);
  
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

  // Fetch courses with region filtering based on country
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['explore-courses', selectedRegion, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*');

      // Apply region filter based on country
      if (selectedRegion !== 'all') {
        switch (selectedRegion) {
          case 'gb-i':
            query = query.in('country', ['Britain & Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Republic of Ireland']);
            break;
          case 'usa':
            query = query.eq('country', 'USA');
            break;
          case 'europe':
            query = query.eq('country', 'Continental Europe');
            break;
          case 'rest':
            query = query.not('country', 'in', '("Britain & Ireland","England","Scotland","Wales","Northern Ireland","Ireland","Republic of Ireland","USA","Continental Europe")');
            break;
        }
      }

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,country.ilike.%${debouncedSearch}%,sub_country.ilike.%${debouncedSearch}%,region.ilike.%${debouncedSearch}%`);
      }

      // Order by global rank first (Top 100 courses), then alphabetically
      query = query.order('global_rank', { ascending: true, nullsFirst: false });
      query = query.order('name', { ascending: true });
      
      // Limit results
      query = query.limit(200);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    { value: 'all', label: 'All Regions' },
    { value: 'gb-i', label: 'Britain & Ireland' },
    { value: 'usa', label: 'United States' },
    { value: 'europe', label: 'Continental Europe' },
    { value: 'rest', label: 'Rest of World' },
  ];

  const handleResetFilters = () => {
    setSelectedRegion('all');
    setRegionWasAuto(false);
    setSearchTerm('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('region');
      url.searchParams.delete('query');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const hasActiveFilters = selectedRegion !== 'all' || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search courses by name or location"
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

      {/* Region Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value);
            setRegionWasAuto(false);
          }}>
            <SelectTrigger className="w-[180px] h-11 bg-card border-border/50 rounded-lg text-sm">
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground hover:text-foreground h-9 text-sm"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset filters
          </Button>
        )}
      </div>
      {selectedRegion !== 'all' && (
        <p className="mt-1 text-xs text-muted-foreground">
          Showing courses in{' '}
          {regionOptions.find((o) => o.value === selectedRegion)?.label || 'selected region'}
          {regionWasAuto && ' • Suggested for you'}
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : courses.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-muted-foreground space-y-2">
            <p className="text-lg font-semibold text-foreground">No courses found</p>
            <p className="text-sm">Try clearing filters or searching another location.</p>
          </div>
          {hasActiveFilters && (
            <Button onClick={handleResetFilters} variant="outline" size="sm">
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-xs text-muted-foreground mb-3">
            Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
          </div>
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
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
