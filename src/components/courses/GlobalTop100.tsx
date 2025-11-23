import React, { useState, useEffect, useRef } from 'react';
import { useGolfCoursesSearch } from '@/hooks/useGolfCoursesSearch';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Award, X } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { scrollToTop } from '@/utils/scrollToTop';
import Top100ClubCallout from './Top100ClubCallout';
import { useSearchParams } from 'react-router-dom';
import {
  PRIMARY_REGIONS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
  subregionKeyToLabel,
} from '@/constants/courseRegions';

const PAGE_SIZE = 50;

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

const GlobalTop100 = () => {
  const listTopRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  
  // URL params take priority, then sessionStorage, then defaults
  const [selectedList, setSelectedList] = useState(() => {
    // 1. Check URL first
    const urlList = searchParams.get('list');
    if (urlList) return urlList;
    
    // 2. Fall back to sessionStorage
    const saved = sessionStorage.getItem('top100-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.list) return parsed.list;
      } catch (e) {
        console.error('Failed to parse top100 filters:', e);
      }
    }
    
    // 3. Default
    return 'global';
  });
  const [selectedSubregion, setSelectedSubregion] = useState<'all' | string>(() => {
    const saved = sessionStorage.getItem('top100-last-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.subregion || 'all';
    }
    return 'all';
  });
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem('top100-last-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.searchTerm || '';
    }
    return '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('top100-last-filters', JSON.stringify({
      list: selectedList,
      subregion: selectedSubregion,
      searchTerm,
    }));
  }, [selectedList, selectedSubregion, searchTerm]);

  // Restore scroll position when returning from course detail
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('top100-scroll');
    if (savedScroll) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
        sessionStorage.removeItem('top100-scroll');
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

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedList, selectedSubregion, debouncedSearch]);

  // Scroll to top when page changes (for pagination buttons)
  useEffect(() => {
    if (page > 0) {
      scrollToTop();
    }
  }, [page]);

  // Fetch available lists
  const { data: lists = [] } = useTop100Lists();

  // Use the search hook for Top 100 lists
  const { data: courses = [], isLoading } = useGolfCoursesSearch({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
    limit: 200,
  });

  // Apply subregion filter client-side
  const normalizedSelectedSub = selectedSubregion === 'all' ? null : selectedSubregion;

  const filteredCourses = (courses || []).filter((course) => {
    if (!normalizedSelectedSub) return true;

    if (!course.sub_country) return false;

    return normalizeLabel(course.sub_country) === normalizedSelectedSub;
  });

  const totalCount = filteredCourses.length;
  const hasMore = totalCount > (page + 1) * PAGE_SIZE;
  
  // Paginate courses
  const paginatedCourses = filteredCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  // Build list options - transform database labels and set correct order
  const listOptions = lists.length > 0 
    ? (() => {
        // Transform labels to add "Top 100" suffix
        const transformed = lists.map(list => ({
          value: list.slug,
          label: list.short_label.includes('Top 100') ? list.short_label : `${list.short_label} Top 100`
        }));
        
        // Define the desired order
        const desiredOrder = ['global', 'usa', 'gb-i', 'europe'];
        
        // Sort according to desired order
        return transformed.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.value);
          const indexB = desiredOrder.indexOf(b.value);
          
          // If both are in the desired order, sort by their position
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          // If only A is in the desired order, it comes first
          if (indexA !== -1) return -1;
          // If only B is in the desired order, it comes first
          if (indexB !== -1) return 1;
          // If neither is in the desired order, keep original order
          return 0;
        });
      })()
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

  const getListLabel = () =>
    listOptions.find((o) => o.value === selectedList)?.label || 'this Top 100 list';

  const hasSearch = debouncedSearch.trim().length > 0;

  const startIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const handleResetFilters = () => {
    setSelectedList('global');
    setSelectedSubregion('all');
    setSearchTerm('');
    setPage(0);
    sessionStorage.setItem('top100-last-filters', JSON.stringify({
      list: 'global',
      subregion: 'all',
      searchTerm: '',
    }));
  };

  // Capture scroll position when clicking a course card
  const handleCourseClick = () => {
    sessionStorage.setItem('top100-scroll', window.scrollY.toString());
  };

  const hasActiveFilters = selectedList !== 'global' || selectedSubregion !== 'all' || searchTerm !== '';

  const currentListLabel = listOptions.find((opt) => opt.value === selectedList)?.label || 'Global Top 100';

  return (
    <div className="mt-4 space-y-4 max-w-2xl mx-auto px-4 pb-6">
      {/* Top 100 Club Callout */}
      <Top100ClubCallout />

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search within this Top 100 list"
          className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border transition-shadow text-base placeholder:text-[15px]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Top 100 List Selector + Sub-region */}
      <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedList}
            onValueChange={(val) => {
              setSelectedList(val);
              setPage(0);
              const regionKey = listSlugToRegionKey(val);
              if (!SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>]?.length) {
                setSelectedSubregion('all');
              }
            }}
          >
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
              <SelectValue placeholder="Choose Top 100 list" />
            </SelectTrigger>
            <SelectContent>
              {listOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-region filter */}
        {(() => {
          const regionKey = listSlugToRegionKey(selectedList);
          const subregions = SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>] || [];
          if (!subregions.length) return null;

          return (
            <div className="flex-1">
              <Select
                value={selectedSubregion}
                onValueChange={setSelectedSubregion}
              >
                <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
                  <SelectValue placeholder="All sub-regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-regions</SelectItem>
                  {subregions.map((s) => (
                    <SelectItem key={s} value={normalizeLabel(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })()}
      </div>

      {/* Stats row */}
      <div className="max-w-xl mx-auto mt-2 space-y-1">
        <p className="text-sm md:text-base text-muted-foreground">
          Showing courses in <span className="font-medium">{currentListLabel}</span>
        </p>
        <div className="flex items-center justify-between text-sm md:text-base text-muted-foreground">
          <span>
            Showing {startIndex}–{endIndex} of {totalCount} courses
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

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">No courses match your filters</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try clearing your search or choosing a different Top 100 list to browse.
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
        
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
              {paginatedCourses.map((course) => (
                <div key={course.id} className="mb-4 sm:mb-0">
                  <CourseCard 
                    course={course}
                    showRankBadge={true}
                    onClick={handleCourseClick}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-3 mt-8 mb-8">
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

export default GlobalTop100;
