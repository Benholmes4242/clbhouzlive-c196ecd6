import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Search, Award, X } from 'lucide-react';
import { Top100JourneyHero } from '@/components/top100/Top100JourneyHero';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import VirtualizedCourseList from './VirtualizedCourseList';
import { type AppSelectOption } from '@/components/ui/AppSelect';

type Top100SortOption = 'official' | 'user_rating';

/** Known Top 100 list slugs for validation. */
const KNOWN_LIST_SLUGS = ['global', 'gb-i', 'usa', 'europe'];

/** Read saved Top 100 filters from sessionStorage (parsed once, shared by initialisers). */
function readSavedFilters(): { list?: string; sort?: string; searchTerm?: string } | null {
  try {
    const raw = sessionStorage.getItem('top100-last-filters');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const Top100CoursesHubPanel = () => {
  const { user } = useSupabaseSession();
  
  // State — initialised from sessionStorage when available
  const [selectedList, setSelectedList] = useState(() => {
    const saved = readSavedFilters();
    if (saved?.list && KNOWN_LIST_SLUGS.includes(saved.list)) return saved.list;
    return 'global';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = readSavedFilters();
    return saved?.searchTerm || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<Top100SortOption>(() => {
    const saved = readSavedFilters();
    const val = saved?.sort;
    return val === 'user_rating' ? 'user_rating' : 'official';
  });

  // Scroll restoration ref
  const hasRestoredScroll = useRef(false);

  // Fetch data
  const { data: progress } = useTop100ProgressForUser(user?.id);
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: lists = [] } = useTop100Lists();

  // Progress calculations
  const totalRated = progress?.total_top100_rated ?? progress?.total_played_top100 ?? 0;
  const startedLists = listSummaries.filter(list => list.played_count > 0);
  const listsCount = startedLists.length;
  const totalCoursesInStartedLists = startedLists.reduce((sum, list) => sum + list.total_courses, 0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Persist filters to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('top100-last-filters', JSON.stringify({
        list: selectedList,
        sort: sortOption,
        searchTerm,
      }));
    } catch { /* ignore */ }
  }, [selectedList, sortOption, searchTerm]);

  // Fetch courses
  const { 
    data: coursesData,
    isLoading,
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten and sort courses
  const allCourses: SearchedCourseWithRating[] = React.useMemo(() => {
    const courses = coursesData?.pages.flat() ?? [];
    
    return [...courses].sort((a, b) => {
      switch (sortOption) {
        case 'user_rating':
          const ratingA = a.average_rating ?? -1;
          const ratingB = b.average_rating ?? -1;
          if (ratingB !== ratingA) return ratingB - ratingA;
          return (a.name ?? '').localeCompare(b.name ?? '');
        case 'official':
        default:
          const rankA = selectedList.includes('global') ? a.list_memberships.find((m: any) => m.list_slug.includes('global'))?.rank :
                       selectedList.includes('usa') ? a.list_memberships.find((m: any) => m.list_slug.includes('usa'))?.rank :
                       selectedList.includes('gb-i') ? a.list_memberships.find((m: any) => m.list_slug.includes('gb-i'))?.rank :
                       selectedList.includes('europe') ? a.list_memberships.find((m: any) => m.list_slug.includes('europe'))?.rank :
                       a.list_memberships[0]?.rank;
          const rankB = selectedList.includes('global') ? b.list_memberships.find((m: any) => m.list_slug.includes('global'))?.rank :
                       selectedList.includes('usa') ? b.list_memberships.find((m: any) => m.list_slug.includes('usa'))?.rank :
                       selectedList.includes('gb-i') ? b.list_memberships.find((m: any) => m.list_slug.includes('gb-i'))?.rank :
                       selectedList.includes('europe') ? b.list_memberships.find((m: any) => m.list_slug.includes('europe'))?.rank :
                       b.list_memberships[0]?.rank;
          return (rankA || 999) - (rankB || 999);
      }
    });
  }, [coursesData, sortOption, selectedList]);

  // Scroll restoration on mount (after courses load)
  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const savedScroll = sessionStorage.getItem('top100-scroll');
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem('top100-scroll');
      });
    }
  }, [allCourses.length]);

  // Save scroll position before navigating to a course detail
  const handleCourseClick = () => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem('top100-scroll', scrollY.toString());
  };

  // List options
  const listOptions = lists.length > 0 
    ? (() => {
        const transformed = lists.map(list => ({
          value: list.slug,
          label: list.short_label.includes('Top 100') ? list.short_label : `${list.short_label} Top 100`
        }));
        const desiredOrder = ['global', 'gb-i', 'usa', 'europe'];
        return transformed.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.value);
          const indexB = desiredOrder.indexOf(b.value);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
      })()
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

  const sortOptions: AppSelectOption<Top100SortOption>[] = [
    { value: 'official', label: 'Official ranking' },
    { value: 'user_rating', label: 'Community rating' },
  ];

  const handleResetFilters = () => {
    setSelectedList('global');
    setSearchTerm('');
    setSortOption('official');
  };

  return (
    <div className="space-y-5">
      {/* Top 100 Journey Hero - Premium progress module */}
      {user && (
        <div className="px-4">
          <Top100JourneyHero
            completedCourses={totalRated}
            totalCoursesInStartedLists={totalCoursesInStartedLists}
            listCount={listsCount}
          />
        </div>
      )}

      {/* Controls Section - sticky search + filters */}
      <div
        className="sticky top-0 z-20 pb-3 space-y-3 -mx-4 px-4"
        style={{
          background: '#F8FAFC',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within this Top 100 list"
            aria-label="Search within Top 100 list"
            className="pl-10 pr-10 h-12 rounded-2xl text-base focus-visible:ring-2 focus-visible:ring-[#F7931E]/30 focus-visible:outline-none"
            style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground active:scale-[0.9] active:opacity-70 transition-all"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* List + Sort selectors */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
          {/* List selector */}
          <div className="flex-1">
            <Select value={selectedList} onValueChange={setSelectedList}>
              <SelectTrigger 
                aria-label="Select Top 100 list" 
                className="h-11 w-full rounded-2xl justify-between text-base focus:outline-none data-[state=open]:ring-0 transition-all duration-150"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', color: '#0F172A' }}
              >
                <SelectValue placeholder="Global Top 100" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 rounded-2xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                {listOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort selector */}
          <div className="flex-1">
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as Top100SortOption)}>
              <SelectTrigger 
                aria-label="Sort courses" 
                className="h-11 w-full rounded-2xl justify-between text-base focus:outline-none data-[state=open]:ring-0 transition-all duration-150"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', color: '#0F172A' }}
              >
                <SelectValue placeholder="Official ranking" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 rounded-2xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="px-4">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-14 rounded-lg" />
                  <Skeleton className="h-5 w-14 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-1">
            {searchTerm ? (
              <Search className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Award className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {searchTerm ? 'No courses found' : 'No courses match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchTerm 
                ? `No courses matching "${searchTerm}" in this Top 100 list.`
                : 'Try choosing a different Top 100 list.'}
            </p>
          </div>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', color: '#0F172A' }}
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </button>
          ) : (
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', color: '#0F172A' }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <VirtualizedCourseList 
          courses={allCourses}
          onCourseClick={handleCourseClick}
          activeListSlug={selectedList}
          showGhostRank={true}
        />
      )}
      </div>
    </div>
  );
};

export default Top100CoursesHubPanel;
