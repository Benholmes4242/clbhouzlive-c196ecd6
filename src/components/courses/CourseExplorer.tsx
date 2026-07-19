import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import { Search, MapPin, X, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import VirtualizedCourseList from './VirtualizedCourseList';
import { RequestCourseCTA } from './RequestCourseCTA';
import { YourNetworkSection } from './network';
import { UnseenReviewsBanner } from './network/UnseenReviewsBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/i18n/format';
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
import { HAIRLINE_INK_10, INK, INK_MUTE, SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';
import { getPageScrollTop, getPrimaryScrollElement, scrollPageTo } from '@/lib/getScrollParent';

type SortOption = 'official_rating' | 'community_rating' | 'recently_added' | 'name_asc' | 'name_desc';

/**
 * Minimal chainable shape of the Supabase query builder — enough to type
 * the sort helper without leaking `any` and without depending on
 * PostgrestFilterBuilder's exhaustive generics.
 */
type OrderableQuery<Q> = {
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ) => Q;
};

/**
 * Apply the current sort option to a Supabase query builder.
 *
 * 'community_rating' never reaches this builder — fetchCoursePage routes it
 * to the explore_courses_by_rating RPC (server-side sort).
 */
function applySortToQuery<Q extends OrderableQuery<Q>>(query: Q, sortOption: SortOption): Q {
  switch (sortOption) {
    case 'community_rating':
      // Unreachable — fetchCoursePage branches to explore_courses_by_rating
      // before calling this helper. Case label retained for exhaustiveness;
      // fall through to default so the query still gets a stable order if
      // an unexpected call ever lands here.
      // fallthrough
    case 'official_rating':
    default:
      query = query.order('global_rank', { ascending: true, nullsFirst: false });
      query = query.order('name', { ascending: true });
      break;
    case 'recently_added':
      query = query.order('created_at', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
  }
  return query;
}


/**
 * Row shape produced by explore_courses_by_rating and the fallback PostgREST
 * select — only the fields the UI + card mapper touch. Kept structural so
 * both call sites converge on one type.
 */
type ExploreCourseRow = {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  thumbnail_image?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  average_rating?: number | null;
  course_rating_aggregates?: Array<{ avg_overall_score: number | null }> | null;
};

interface FetchCoursePageParams {
  selectedRegion: PrimaryRegionKey;
  selectedSubregion: string;
  debouncedSearch: string;
  sortOption: SortOption;
  offset: number;
}

/** Single query builder – eliminates duplication between initial fetch and loadMore */
async function fetchCoursePage({ selectedRegion, selectedSubregion, debouncedSearch, sortOption, offset }: FetchCoursePageParams) {
  const isFirstPage = offset === 0;

  // ── Community-rating sort: use dedicated server-side RPC ──
  if (sortOption === 'community_rating') {
    const countryParam = selectedRegion !== PRIMARY_REGIONS.ALL
      ? regionKeyToDbValue(selectedRegion) || null
      : null;
    const subCountryParam = selectedSubregion !== 'all'
      ? subregionKeyToLabel(selectedRegion, selectedSubregion)
      : null;
    const searchParam = debouncedSearch && debouncedSearch.length >= 2
      ? debouncedSearch
      : null;

    const { data, error } = await supabase.rpc('explore_courses_by_rating', {
      p_country: countryParam,
      p_sub_country: subCountryParam,
      p_search: searchParam,
      p_limit: EXPLORE_PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      console.error('CourseExplorer rating-sort RPC error:', error);
      throw error;
    }

    const courses = (data || []) as ExploreCourseRow[];

    // For first page we need a count – do a lightweight count query
    let totalCount: number | null = null;
    if (isFirstPage) {
      let countQuery = supabase
        .from('golf_courses')
        .select('id', { count: 'exact', head: true });
      if (countryParam) countQuery = countQuery.eq('country', countryParam);
      if (subCountryParam) countQuery = countQuery.eq('sub_country', subCountryParam);
      if (searchParam) countQuery = countQuery.ilike('name', `%${searchParam}%`);
      const { count } = await countQuery;
      totalCount = count ?? 0;
    }

    return { courses, totalCount };
  }

  // ── All other sort modes: standard PostgREST query ──
  // Explicit column list — only what fromGolfCourse + UnifiedCourseCard read.
  // Keeps the payload small (avoids description/website_url/etc.) for faster scroll.
  let query = supabase
    .from('golf_courses')
    .select(
      `id, name, country, sub_country, thumbnail_image, global_rank, regional_rank, usa_rank, course_rating_aggregates(avg_overall_score)`,
      isFirstPage ? { count: 'exact' } : undefined,
    );

  // Region filter
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

  // Search filter
  if (debouncedSearch && debouncedSearch.length >= 2) {
    query = query.ilike('name', `%${debouncedSearch}%`);
  }

  // Sorting
  query = applySortToQuery(query, sortOption);

  // Pagination range
  query = query.range(offset, offset + EXPLORE_PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('CourseExplorer query error:', error);
    throw error;
  }

  const courses = ((data || []) as ExploreCourseRow[]).map((course) => ({
    ...course,
    average_rating: course.course_rating_aggregates?.[0]?.avg_overall_score ?? null,
  }));

  return {
    courses,
    totalCount: isFirstPage ? (count ?? 0) : null,
  };
}

// ─── Top-level sub-components (stable references across renders) ───

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="space-y-3 animate-pulse">
        <Skeleton className="h-48 w-full rounded-sq-sm bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
        <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
        <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </div>
    ))}
  </div>
);

const InlineLoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 animate-in fade-in duration-150">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-card sm:border sm:border-border/60 sm:rounded-sq-md overflow-hidden">
        <Skeleton className="w-full aspect-[16/9] rounded-none" />
        <div className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold">{t('explorer.unableToLoadTitle')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('explorer.unableToLoadBody')}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
        style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
      >
        <ChevronDown className="h-4 w-4 rotate-180" />
        {tc('action.retry')}
      </button>
    </div>
  );
};

const InlineRetryCard = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation('courses');
  return (
    <div className="max-w-md mx-auto mt-4">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-card border border-border text-sm text-muted-foreground transition-colors active:scale-[0.98] active:opacity-70"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {t('explorer.loadMoreRetry')}
      </button>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────

const CourseExplorer = () => {
  const { t } = useTranslation('courses');
  const listTopRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // URL params take priority, then sessionStorage, then defaults
  const [selectedRegion, setSelectedRegion] = useState<PrimaryRegionKey>(() => {
    const urlRegion = searchParams.get('region');
    // Only trust the param when it is one of OUR keys — the Discover tab
    // shares this URL and writes its own region slugs (uk-ireland,
    // continental-europe, rest-of-world, usa) here.
    if (urlRegion && (Object.values(PRIMARY_REGIONS) as string[]).includes(urlRegion)) {
      return urlRegion as PrimaryRegionKey;
    }
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) return parsed.region;
      } catch (e) { /* ignore */ }
    }
    return PRIMARY_REGIONS.ALL;
  });

  const [selectedSubregion, setSelectedSubregion] = useState(() => {
    // Gate the ?sub= read on the same validity check as ?region= above.
    // A Discover URL never carries ?sub=, so if the region param isn't one
    // of our keys we drop any accompanying sub too.
    const urlRegion = searchParams.get('region');
    const urlRegionValid =
      !!urlRegion && (Object.values(PRIMARY_REGIONS) as string[]).includes(urlRegion);
    const urlSub = urlRegionValid ? searchParams.get('sub') : null;
    if (urlSub) return urlSub;
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subregion) return parsed.subregion;
      } catch (e) { /* ignore */ }
    }
    return 'all';
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem('explore-last-filters');
    if (saved) {
      try { return JSON.parse(saved).searchTerm || ''; } catch { return ''; }
    }
    return '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<SortOption>('community_rating');
  const [isScrolled, setIsScrolled] = useState(false);

  // Sticky filter bar elevation on scroll.
  // Mirrors VirtualizedCourseList.getScrollContainer() so the listener and
  // the virtualization scroll handler share the same source of truth.
  // On engines where #root is the scroller, window.scrollY stays at 0,
  // so we resolve the actual scroll element first and fall back to window.
  useEffect(() => {
    const scroller = getPrimaryScrollElement();
    if (!scroller) return;
    const onScroll = () => {
      setIsScrolled(scroller.scrollTop > 8);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('explore-last-filters', JSON.stringify({
        region: selectedRegion,
        subregion: selectedSubregion,
        searchTerm,
      }));
    } catch { /* ignore */ }
  }, [selectedRegion, selectedSubregion, searchTerm]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // (Cleanup removed — explore-scroll is self-cleaning after restore,
  //  explore-last-filters must persist across unmounts/tab switches)

  // ─── useInfiniteQuery ─────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['explore-courses', selectedRegion, selectedSubregion, debouncedSearch, sortOption],
    queryFn: ({ pageParam = 0 }) =>
      fetchCoursePage({
        selectedRegion,
        selectedSubregion,
        debouncedSearch,
        sortOption,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.courses.length < EXPLORE_PAGE_SIZE) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.courses.length, 0);
      // If we know the total count from page 1 and we've loaded everything, stop
      const totalCount = allPages[0]?.totalCount;
      if (totalCount != null && totalLoaded >= totalCount) return undefined;
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    retry: 2,
  });

  // Derived state (memoised to preserve reference for React.memo on VirtualizedCourseList)
  const allCourses = useMemo(
    () => {
      const flat = data?.pages.flatMap((page) => page.courses) ?? [];
      // Community rating sort is now handled server-side via RPC — no client-side re-sort needed
      return flat;
    },
    [data?.pages],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // ─── Scroll restoration ──────────────────────────────────────────
  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const savedScroll = sessionStorage.getItem('explore-scroll');
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const scrollTarget = parseInt(savedScroll);
        scrollPageTo(scrollTarget, 'instant');
        sessionStorage.removeItem('explore-scroll');
      });
    }
  }, [allCourses.length]);

  // ─── Intersection Observer (sentinel) ─────────────────────────────
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const regionOptions = Object.entries(PRIMARY_REGION_LABELS).map(([key, label]) => ({
    value: key as PrimaryRegionKey,
    label,
  }));

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
    const scrollY = getPageScrollTop();
    sessionStorage.setItem('explore-scroll', scrollY.toString());
  };

  const sortOptions: AppSelectOption<SortOption>[] = [
    { value: 'official_rating', label: 'Official Rating' },
    { value: 'community_rating', label: 'Community Rating' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'name_asc', label: 'A – Z' },
    { value: 'name_desc', label: 'Z – A' },
  ];


  return (
    <div className="w-full space-y-4">
      {/* Unseen friend reviews banner */}
      <UnseenReviewsBanner />

      {/* Your Network Section - Shows activity from friends */}
      <YourNetworkSection />

      <div
        className="pb-3 space-y-4 -mx-4 px-4"
        style={{
          background: SLATE_50,
          borderBottom: 'none',
          paddingTop: '8px',
        }}
      >
      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" aria-hidden="true" />
        <Input
          placeholder={t('explorer.searchPlaceholder', { defaultValue: 'Search by name, county or area…' })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E]/30 transition-all duration-150 text-base placeholder:text-[15px]"
          style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}` }}
          aria-label={t('explorer.searchA11y', { defaultValue: 'Search golf courses' })}
          role="searchbox"
        />
        {isFetching && searchTerm && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2" aria-label={t('explorer.searching', { defaultValue: 'Searching' })}>
            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground active:opacity-70 transition-opacity"
            aria-label={t('searchSheet.clearSearchA11y')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Region + sub-region filters */}
      <div className="flex items-center gap-3" role="group" aria-label={t('explorer.filtersA11y', { defaultValue: 'Course filters' })} onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        {/* Primary region */}
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={(value) => {
            setSelectedRegion(value as PrimaryRegionKey);
            setSelectedSubregion('all');
          }}>
            <SelectTrigger 
              className="h-11 w-full rounded-2xl justify-between text-base focus:outline-none data-[state=open]:ring-0 transition-all duration-150"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}` }}
              aria-label={t('explorer.selectRegionA11y', { defaultValue: 'Select region' })}
            >
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder={t('explorer.allRegions', { defaultValue: 'All Regions' })} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
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
            disabled={selectedRegion === PRIMARY_REGIONS.ALL || !SUBREGIONS[selectedRegion as Exclude<PrimaryRegionKey, 'all'>]?.length}
          >
            <SelectTrigger 
              className="h-11 w-full rounded-2xl justify-between text-base focus:outline-none data-[state=open]:ring-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}` }}
              aria-label={t('explorer.subRegionA11y')}
            >
              <SelectValue placeholder={selectedRegion === PRIMARY_REGIONS.ALL ? t('explorer.chooseRegionFirst') : t('explorer.allSubRegions')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <SelectItem value="all">{t('explorer.allSubRegions')}</SelectItem>
              {selectedRegion !== PRIMARY_REGIONS.ALL && SUBREGIONS[selectedRegion as Exclude<PrimaryRegionKey, 'all'>]?.map((s) => (
                <SelectItem key={s} value={normalizeLabel(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      </div>

      {/* Context row with sort — scrolls with content */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span style={{
            fontSize: 13, color: INK_MUTE, flex: 1, lineHeight: 1.35,
            fontWeight: 500,
          }}>
            {hasSearch ? (
              <Trans
                i18nKey={totalCount === 1 ? 'explorer.results_one' : 'explorer.results_other'}
                ns="courses"
                values={{ count: totalCount, formattedCount: formatNumber(totalCount) }}
                components={{ 1: <strong style={{ color: '#0F172A', fontWeight: 700 }} /> }}
              />
            ) : selectedRegion === PRIMARY_REGIONS.ALL ? (
              <Trans
                i18nKey={totalCount === 1 ? 'explorer.countWorldwide_one' : 'explorer.countWorldwide_other'}
                ns="courses"
                values={{ count: totalCount, formattedCount: formatNumber(totalCount) }}
                components={{ 1: <strong style={{ color: '#0F172A', fontWeight: 700 }} /> }}
              />
            ) : (
              <Trans
                i18nKey={totalCount === 1 ? 'explorer.countInRegion_one' : 'explorer.countInRegion_other'}
                ns="courses"
                values={{ count: totalCount, formattedCount: formatNumber(totalCount), region: getRegionLabel() }}
                components={{ 1: <strong style={{ color: '#0F172A', fontWeight: 700 }} /> }}
              />
            )}
          </span>
          <AppSelect
            value={sortOption}
            onChange={(v) => setSortOption(v as SortOption)}
            options={sortOptions}
            ariaLabel="Sort courses"
            triggerClassName="h-8 text-[12px] px-3 active:scale-[0.98]"
          />
        </div>
      )}

      {/* Results */}
      <div>
      <div ref={listTopRef} />
      
      {isLoading ? (
        <LoadingSkeleton />
      ) : (isError && allCourses.length === 0) ? (
        <ErrorState onRetry={() => refetch()} />
      ) : allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3 animate-in fade-in duration-300">
          <RequestCourseCTA variant="hero" prefillName={debouncedSearch || searchTerm} />
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
            >
              {t('explorer.resetFilters')}
            </button>
          )}
        </div>

      ) : (
        <>
          <VirtualizedCourseList 
            courses={allCourses}
            onCourseClick={handleCourseClick}
          />

          {/* Sentinel + loading skeletons */}
          {hasNextPage && !isError && (
            <div ref={sentinelRef} className="w-full">
              {isFetchingNextPage && <InlineLoadingSkeleton />}
            </div>
          )}

          {/* Inline retry on pagination error */}
          {isError && !isFetchingNextPage && allCourses.length > 0 && (
            <InlineRetryCard onRetry={() => fetchNextPage()} />
          )}

          {/* Loading indicator during retry */}
          {isError && isFetchingNextPage && allCourses.length > 0 && (
            <InlineLoadingSkeleton />
          )}

          {/* "Request a course" row — always present when a search is active */}
          {(debouncedSearch || searchTerm).trim().length > 0 && !hasNextPage && (
            <div className="mt-3 -mx-4 border-t border-slate-100">
              <RequestCourseCTA variant="row" prefillName={debouncedSearch || searchTerm} />
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default CourseExplorer;
