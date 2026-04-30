import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Search, Award, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import VirtualizedCourseList from './VirtualizedCourseList';
import { AppSelect, type AppSelectOption } from '@/components/ui/AppSelect';

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
  const navigate = useNavigate();
  
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

  // Flatten and sort courses (and attach displayRank reflecting list position)
  const allCourses: (SearchedCourseWithRating & { displayRank?: number })[] = React.useMemo(() => {
    const courses = coursesData?.pages.flat() ?? [];

    // Determine the rank-matching slug fragment ONCE, based on selectedList,
    // instead of running 4× .includes + .find() inside every comparator call.
    const matcher =
      selectedList.includes('global') ? 'global' :
      selectedList.includes('usa') ? 'usa' :
      selectedList.includes('gb-i') ? 'gb-i' :
      selectedList.includes('europe') ? 'europe' :
      null;

    const getRankForSelectedList = (course: SearchedCourseWithRating): number => {
      const memberships = course.list_memberships ?? [];
      if (matcher) {
        const m = memberships.find((x: any) => x.list_slug.includes(matcher));
        return m?.rank ?? 999;
      }
      return memberships[0]?.rank ?? 999;
    };

    if (sortOption === 'user_rating') {
      const sorted = [...courses].sort((a, b) => {
        const ratingA = a.average_rating ?? -1;
        const ratingB = b.average_rating ?? -1;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
      return sorted.map((c, idx) => ({ ...c, displayRank: idx + 1 }));
    }

    // 'official' sort — pre-extract rank keys so the comparator is O(1)
    const withRankKey = courses.map((c) => ({
      course: c,
      rankKey: getRankForSelectedList(c),
    }));

    withRankKey.sort((a, b) => a.rankKey - b.rankKey);

    return withRankKey.map((x, idx) => ({ ...x.course, displayRank: idx + 1 }));
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

  // Active list short label (used for placeholder + meta row)
  const activeListShortLabel = (() => {
    const opt = listOptions.find(o => o.value === selectedList);
    if (!opt) return 'Top 100';
    return opt.label.replace(/\s*Top 100\s*$/, '').trim();
  })();
  // Total courses in the active list — pulled from the per-list summaries
  const totalCoursesInActiveList =
    listSummaries.find(l => l.slug === selectedList)?.total_courses ?? allCourses.length;

  return (
    <div className="space-y-4">
      {/* Editorial header — left-aligned, mirrors Explore's Your Network pattern */}
      <div className="px-4 pt-1">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                Official World Ranking
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              The world's best
            </h2>
            {user && totalCoursesInStartedLists > 0 && (
              <p style={{
                fontSize: 11, color: '#64748B', margin: '6px 0 0',
                fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' as const,
              }}>
                <span style={{ color: '#F7931E' }}>
                  {totalRated} of {totalCoursesInStartedLists}
                </span>
                {' '}COMPLETED · {listsCount} {listsCount === 1 ? 'LIST' : 'LISTS'}
              </p>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={() => navigate('/top100?tab=my-progress')}
              style={{
                display: 'flex', alignItems: 'center', gap: 2,
                fontSize: 12, fontWeight: 600, color: '#c97a10',
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: '6px 0 8px', flexShrink: 0,
                letterSpacing: '-0.005em',
              }}
              className="active:opacity-70 transition-opacity"
            >
              Your journey <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* List filter — horizontal pill row, scrollable on overflow */}
      <div className="-mx-4 px-4 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{`.top100-pill-row::-webkit-scrollbar { display: none; }`}</style>
        <div className="top100-pill-row" style={{ display: 'flex', gap: 18, paddingBottom: 2 }}>
          {listOptions.map((option) => {
            const isActive = option.value === selectedList;
            const pillLabel = option.label.replace(/\s*Top 100\s*$/, '').trim() || option.label;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedList(option.value)}
                aria-pressed={isActive}
                style={{
                  flexShrink: 0,
                  padding: '6px 4px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#0F172A' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'color 150ms',
                  letterSpacing: isActive ? '-0.01em' : 0,
                  whiteSpace: 'nowrap',
                  minHeight: 34,
                }}
                className="active:scale-[0.97]"
              >
                {pillLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search bar — scrolls with content (no sticky behaviour) */}
      <div className="-mx-4 px-4" style={{ paddingTop: 8 }}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search the ${activeListShortLabel} Top 100`}
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
      </div>

      {/* Meta row — small-caps tracked label + sort selector, mirrors Explore */}
      {!isLoading && allCourses.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2 px-4">
          <span style={{
            fontSize: 10, color: '#475569', flex: 1,
            fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            {searchTerm ? (
              <>RESULTS · {allCourses.length} {allCourses.length === 1 ? 'COURSE' : 'COURSES'}</>
            ) : (
              <>{activeListShortLabel.toUpperCase()} · {totalCoursesInActiveList} COURSES</>
            )}
          </span>
          <AppSelect
            value={sortOption}
            onChange={(v) => setSortOption(v as Top100SortOption)}
            options={sortOptions}
            ariaLabel="Sort courses"
            triggerClassName="h-8 text-[12px] px-3 active:scale-[0.98]"
          />
        </div>
      )}

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
