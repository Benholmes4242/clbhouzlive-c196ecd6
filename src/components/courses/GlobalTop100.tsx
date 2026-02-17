import React, { useState, useEffect, useRef } from 'react';
import { useGolfCoursesInfinite } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Award, X } from 'lucide-react';
import { UnifiedCourseCard } from './UnifiedCourseCard';
import { fromGolfCourse } from '@/lib/mappers/toCourseCardModel';
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
import { AppSelect, AppSelectOption } from '@/components/ui/AppSelect';
import { COURSES_PAGE_SIZE } from '@/config/pagination';
import { UnifiedPagination } from '@/components/ui/UnifiedPagination';

type Top100SortOption = 'official' | 'name_asc' | 'name_desc';

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
  const hasInitialisedFromUrlRef = useRef(false);
  const mountedRef = useRef(true);
  
  // URL params take priority, then sessionStorage, then defaults
  const [selectedList, setSelectedList] = useState(() => {
    // 1. Check URL first
    const urlList = searchParams.get('list');
    if (urlList) {
      hasInitialisedFromUrlRef.current = true;
      return urlList;
    }
    
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
  const [sortOption, setSortOption] = useState<Top100SortOption>('official');

  // Save filters to sessionStorage whenever they change (only after URL initialization)
  useEffect(() => {
    // Don't immediately overwrite URL-driven state on first render
    if (!hasInitialisedFromUrlRef.current || !mountedRef.current) return;

    try {
      sessionStorage.setItem('top100-last-filters', JSON.stringify({
        list: selectedList,
        subregion: selectedSubregion,
        searchTerm,
      }));
    } catch {
      // fail safe – ignore storage errors
    }
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
  }, [selectedList, selectedSubregion, debouncedSearch, sortOption]);

  // Scroll to top when page changes (for pagination buttons)
  useEffect(() => {
    if (page > 0) {
      scrollToTop();
    }
  }, [page]);

  // Cleanup on unmount - clear sessionStorage to prevent stale state on revisit
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        sessionStorage.removeItem('top100-scroll');
        sessionStorage.removeItem('top100-last-filters');
      } catch (e) {
        console.error('Failed to clear top100 storage:', e);
      }
    };
  }, []);

  // Fetch available lists
  const { data: lists = [] } = useTop100Lists();

  // Validate selectedList against available lists once they're loaded
  useEffect(() => {
    if (!lists || !lists.length) return;

    setSelectedList((current) => {
      // If current is already valid, keep it
      if (lists.some((list) => list.slug === current)) return current;

      // If not valid, fall back to 'global' or first list
      const global = lists.find((l) => l.slug === 'global');
      return global?.slug ?? lists[0].slug;
    });
  }, [lists]);

  // B1: Use paginated infinite query instead of limit: 999
  const { 
    data: coursesData,
    isLoading,
    fetchNextPage,
    hasNextPage: hasMorePages,
    isFetchingNextPage
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten pages into single array
  const courses = React.useMemo(() => {
    return coursesData?.pages.flat() ?? [];
  }, [coursesData]);

  // Apply subregion filter and sorting client-side
  const normalizedSelectedSub = selectedSubregion === 'all' ? null : selectedSubregion;

  let filteredCourses = (courses || []).filter((course) => {
    if (!normalizedSelectedSub) return true;

    if (!course.sub_country) return false;

    return normalizeLabel(course.sub_country) === normalizedSelectedSub;
  });

  // Apply sorting
  filteredCourses = [...filteredCourses].sort((a, b) => {
    switch (sortOption) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'official':
      default:
        // Sort by the relevant rank based on selected list
        const rankA = selectedList.includes('global') ? a.list_memberships.find(m => m.list_slug.includes('global'))?.rank :
                     selectedList.includes('usa') ? a.list_memberships.find(m => m.list_slug.includes('usa'))?.rank :
                     selectedList.includes('gb-i') ? a.list_memberships.find(m => m.list_slug.includes('gb-i'))?.rank :
                     selectedList.includes('europe') ? a.list_memberships.find(m => m.list_slug.includes('europe'))?.rank :
                     a.list_memberships[0]?.rank;
        const rankB = selectedList.includes('global') ? b.list_memberships.find(m => m.list_slug.includes('global'))?.rank :
                     selectedList.includes('usa') ? b.list_memberships.find(m => m.list_slug.includes('usa'))?.rank :
                     selectedList.includes('gb-i') ? b.list_memberships.find(m => m.list_slug.includes('gb-i'))?.rank :
                     selectedList.includes('europe') ? b.list_memberships.find(m => m.list_slug.includes('europe'))?.rank :
                     b.list_memberships[0]?.rank;
        
        return (rankA || 999) - (rankB || 999);
    }
  });

  const totalCount = filteredCourses.length;
  
  // B2: Client-side pagination for filtered/sorted results
  const paginatedCourses = filteredCourses.slice(page * COURSES_PAGE_SIZE, (page + 1) * COURSES_PAGE_SIZE);
  
  const startIndex = totalCount === 0 ? 0 : page * COURSES_PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * COURSES_PAGE_SIZE, totalCount);
  const hasNextPage = endIndex < totalCount || hasMorePages;

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

  const sortOptions: AppSelectOption<Top100SortOption>[] = [
    { value: 'official', label: 'Official Rating' },
    { value: 'name_asc', label: 'A–Z' },
    { value: 'name_desc', label: 'Z–A' },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Top 100 Club Callout */}
      <Top100ClubCallout />

      {/* Divider */}
      <div className="mt-4 mb-3 h-px w-full bg-slate-200/70" />

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search within this Top 100 list"
          className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--slate-secondary)]/70 focus-visible:border-[color:var(--slate-secondary)] transition-shadow text-base placeholder:text-[15px]"
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
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
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
                <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
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

      {/* Context line with sort button */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex-1">
            Exploring the <span className="font-medium">{currentListLabel}</span>
          </p>
          <AppSelect
            value={sortOption}
            onChange={(v) => setSortOption(v as Top100SortOption)}
            options={sortOptions}
            ariaLabel="Sort courses"
            triggerClassName="h-9"
          />
        </div>
      )}


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
                <div key={course.id} className="mb-0">
                  <UnifiedCourseCard 
                    course={fromGolfCourse(course)}
                    variant="vertical"
                    showRankBadges={true}
                    showRating={true}
                    onClick={handleCourseClick}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination Footer */}
          <UnifiedPagination
            page={page}
            total={totalCount}
            hasNextPage={hasNextPage}
            onNext={() => {
              if (hasMorePages && endIndex >= totalCount) {
                fetchNextPage();
              } else {
                setPage((p) => p + 1);
              }
            }}
            onPrev={() => setPage((p) => p - 1)}
            disabled={isLoading || isFetchingNextPage}
            scrollTargetRef={listTopRef as React.RefObject<HTMLElement>}
          />
        </div>
      )}
    </div>
  );
};

export default GlobalTop100;
