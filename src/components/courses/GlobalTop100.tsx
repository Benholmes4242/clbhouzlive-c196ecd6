import React, { useState, useEffect } from 'react';
import { useGolfCoursesSearch } from '@/hooks/useGolfCoursesSearch';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Award, X } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PRIMARY_REGIONS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
  subregionKeyToLabel,
} from '@/constants/courseRegions';

const TOP100_STORAGE_KEY = 'clbhouz_top100_list_v1';
const TOP100_SUB_STORAGE_KEY = 'clbhouz_top100_subregion_v1';
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

function getInitialTop100List(): { value: string; auto: boolean } {
  const params = new URLSearchParams(window.location.search);
  const urlList = params.get('list');
  if (urlList) {
    return { value: urlList, auto: false };
  }

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(TOP100_STORAGE_KEY);
    if (stored) {
      return { value: stored, auto: false };
    }
  }

  // Light heuristic similar to regions
  let autoList = 'global';
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en-gb') || lang.startsWith('en-ie')) {
      autoList = 'gb-i';
    } else if (lang.startsWith('en-us')) {
      autoList = 'usa';
    }
  }

  return { value: autoList, auto: autoList !== 'global' };
}

const GlobalTop100 = () => {
  const initialList = getInitialTop100List();
  const [selectedList, setSelectedList] = useState(initialList.value);
  const [listWasAuto, setListWasAuto] = useState(initialList.auto);
  const [selectedSubregion, setSelectedSubregion] = useState<'all' | string>('all');
  const [page, setPage] = useState(0);
  
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

  // Restore subregion from URL/localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const urlSub = url.searchParams.get('sub');

    if (urlSub) {
      setSelectedSubregion(urlSub);
      return;
    }

    const stored = window.localStorage.getItem(TOP100_SUB_STORAGE_KEY);
    if (stored) {
      setSelectedSubregion(stored);
    }
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedList, selectedSubregion, debouncedSearch]);

  // Persist list selection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(TOP100_STORAGE_KEY, selectedList);

    const url = new URL(window.location.href);
    url.searchParams.set('list', selectedList);
    window.history.replaceState({}, '', url.toString());
  }, [selectedList]);

  // Persist sub-region to URL + storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(TOP100_SUB_STORAGE_KEY, selectedSubregion);

    const url = new URL(window.location.href);
    if (selectedSubregion && selectedSubregion !== 'all') {
      url.searchParams.set('sub', selectedSubregion);
    } else {
      url.searchParams.delete('sub');
    }

    window.history.replaceState({}, '', url.toString());
  }, [selectedSubregion]);

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
  const hasMore = false; // Top 100 lists are limited, no pagination needed

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

  // Build list options - default to 'global' as the main Top 100 list
  const listOptions = lists.length > 0 
    ? lists.map(list => ({ value: list.slug, label: list.short_label }))
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

  const getListLabel = () =>
    listOptions.find((o) => o.value === selectedList)?.label || 'this Top 100 list';

  const hasSearch = debouncedSearch.trim().length > 0;

  const startIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const handleResetFilters = () => {
    setSelectedList('global');
    setListWasAuto(false);
    setSelectedSubregion('all');
    setSearchTerm('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('list');
      url.searchParams.delete('sub');
      url.searchParams.delete('query');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const hasActiveFilters = selectedList !== 'global' || selectedSubregion !== 'all' || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search within this Top 100 list"
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

      {/* Top 100 List Selector */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Viewing:{' '}
            {listOptions.find((opt) => opt.value === selectedList)?.label ||
              'Global Top 100'}
            {listWasAuto && ' • Suggested for you'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <Select
            value={selectedList}
            onValueChange={(value) => {
              setSelectedList(value);
              setListWasAuto(false);
              const regionKey = listSlugToRegionKey(value);
              if (!SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>]?.length) {
                setSelectedSubregion('all');
              }
            }}
          >
            <SelectTrigger className="w-full h-11 bg-card border-border/50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Top 100 List" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {listOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sub-region, only if this Top 100 list maps to a region with subregions */}
          {(() => {
            const regionKey = listSlugToRegionKey(selectedList);
            const subregions = SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>] || [];

            if (!subregions.length) return null;

            return (
              <Select
                value={selectedSubregion}
                onValueChange={setSelectedSubregion}
              >
                <SelectTrigger className="w-full h-11 bg-card border-border/50 rounded-lg text-sm">
                  <SelectValue placeholder="All sub-regions" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All sub-regions</SelectItem>
                  {subregions.map((s) => (
                    <SelectItem
                      key={s}
                      value={normalizeLabel(s)}
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start px-0 h-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={handleResetFilters}
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset filters
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">No courses match this Top 100 search</h3>
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
          {/* Context line */}
          {totalCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {hasSearch ? (
                <>
                  Results for "{debouncedSearch}" in{' '}
                  <span className="font-medium">{getListLabel()}</span>
                  {normalizedSelectedSub && (
                    <>
                      {' '}
                      · filtered by {subregionKeyToLabel(listSlugToRegionKey(selectedList), normalizedSelectedSub)}
                    </>
                  )}
                </>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium">{getListLabel()}</span>
                  {normalizedSelectedSub && (
                    <>
                      {' '}
                      · filtered by {subregionKeyToLabel(listSlugToRegionKey(selectedList), normalizedSelectedSub)}
                    </>
                  )}
                </>
              )}
            </p>
          )}

          {/* Range line */}
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalCount <= PAGE_SIZE && page === 0 ? (
                <>Showing all {totalCount} course{totalCount !== 1 && 's'}</>
              ) : (
                <>
                  Showing {startIndex}–{endIndex} of {totalCount} courses
                </>
              )}
            </p>
          )}

          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="mb-4 sm:mb-0">
                  <CourseCard 
                    course={course}
                    showRankBadge={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4 mb-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
              >
                Load next {PAGE_SIZE} courses
              </Button>
            </div>
          )}

          {page > 0 && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-2 text-xs text-muted-foreground underline"
            >
              Back to top
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalTop100;
