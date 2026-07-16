import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Search, Award, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import VirtualizedCourseList from './VirtualizedCourseList';
import { AppSelect, type AppSelectOption } from '@/components/ui/AppSelect';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FilterChips } from '@/components/ui/FilterChips';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, INK, INK_FAINT, INK_MUTE, SLATE_600, SURFACE } from '@/features/courses/_shared/tokens';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';

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

interface Top100CoursesHubPanelProps {
  shellTabs?: React.ReactNode;
  rateNudge?: React.ReactNode;
}

const Top100CoursesHubPanel: React.FC<Top100CoursesHubPanelProps> = ({ shellTabs, rateNudge }) => {
  const { t } = useTranslation('courses');
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
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: lists = [] } = useTop100Lists();

  // Cross-list progress — only counts lists the user has actually started
  // (at least 1 played). Mirrors the original framing the previous panel had.
  const crossListProgress = React.useMemo(() => {
    const started = listSummaries.filter(s => s.played_count > 0);
    if (started.length === 0) return null;
    const totalRated = started.reduce((acc, s) => acc + s.played_count, 0);
    const totalInStartedLists = started.reduce((acc, s) => acc + s.total_courses, 0);
    return {
      totalRated,
      totalInStartedLists,
      listsStarted: started.length,
    };
  }, [listSummaries]);

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
        const scrollTarget = parseInt(savedScroll);
        scrollPageTo(scrollTarget, 'instant');
        sessionStorage.removeItem('top100-scroll');
      });
    }
  }, [allCourses.length]);

  // Save scroll position before navigating to a course detail
  const handleCourseClick = () => {
    const scrollY = getPageScrollTop();
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
    <div>
      {/* SCOPE 1 — non-sticky: shell tabs + editorial header */}
      <div style={{ paddingBottom: 16 }}>
        {shellTabs}
        <div className="px-4 pt-3">
          {rateNudge}
          <SectionHeader
            role="section"
            accent="#F7931E"
            kicker="TOP 100"
            title="The world's best"
            cutLine={false}
          />
          {crossListProgress && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: SLATE_600,
                margin: '6px 0 0',
                letterSpacing: '-0.005em',
                fontFamily: "'Geist', sans-serif",
              }}
            >
              <Trans
                i18nKey={crossListProgress.listsStarted === 1 ? 'top100.progress_one' : 'top100.progress_other'}
                ns="courses"
                values={{
                  rated: crossListProgress.totalRated,
                  total: crossListProgress.totalInStartedLists,
                  count: crossListProgress.listsStarted,
                }}
                components={{
                  1: <span style={{
                    color: AMBER,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"zero" 0',
                  }} />,
                }}
              />
            </p>
          )}
        </div>
      </div>

      {/* SCOPE 2 — sticky pills row + rest */}
      <div>
        {/* Sticky list filter pills — full-bleed glass row */}
        <div
          className="sticky"
          style={{
            top: 'var(--sat, 0px)',
            zIndex: 10,
            background: 'rgba(248,250,252,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '8px 0 10px',
            marginTop: -1,
          }}
        >
          <div className="px-4 flex justify-center">
            <FilterChips
              options={listOptions.map((o) => ({
                id: o.value,
                label: o.label.replace(/\s*Top 100\s*$/, '').trim() || o.label,
              }))}
              value={selectedList}
              onChange={(id) => setSelectedList(id)}
              ariaLabel={t('top100.listsA11y')}
            />
          </div>
        </div>

        <div className="px-4 space-y-4 pt-4">
          {/* Search bar — non-sticky */}
          <div className="-mx-4 px-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('top100.searchPlaceholder', { listLabel: activeListShortLabel })}
                aria-label={t('top100.searchA11y')}
                className="pl-10 pr-10 h-12 rounded-2xl text-base focus-visible:ring-2 focus-visible:ring-[#F7931E]/30 focus-visible:outline-none"
                style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}` }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground active:scale-[0.9] active:opacity-70 transition-all"
                  aria-label={t('top100.clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Meta row */}
          {!isLoading && allCourses.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <span style={{
                fontSize: 13, color: INK_MUTE, flex: 1, lineHeight: 1.35,
                fontWeight: 500,
              }}>
                {searchTerm ? (
                  <Trans
                    i18nKey={allCourses.length === 1 ? 'top100.metaResults_one' : 'top100.metaResults_other'}
                    ns="courses"
                    values={{ count: allCourses.length }}
                    components={{ 1: <strong style={{ color: INK, fontWeight: 700 }} /> }}
                  />
                ) : (
                  <Trans
                    i18nKey={totalCoursesInActiveList === 1 ? 'top100.metaCourses_one' : 'top100.metaCourses_other'}
                    ns="courses"
                    values={{ count: totalCoursesInActiveList, listLabel: activeListShortLabel }}
                    components={{ 1: <strong style={{ color: INK, fontWeight: 700 }} /> }}
                  />
                )}
              </span>
              <AppSelect
                value={sortOption}
                onChange={(v) => setSortOption(v as Top100SortOption)}
                options={sortOptions}
                ariaLabel={t('explorer.sortA11y')}
                triggerClassName="h-8 text-[12px] px-3 active:scale-[0.98]"
              />
            </div>
          )}

          {/* Rankings List */}
          <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3 rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_7}` }}>
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
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
                  style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
                >
                  <X className="h-3.5 w-3.5" />
                  {t('top100.clearSearch')}
                </button>
              ) : (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
                  style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
                >
                  {t('top100.resetFilters')}
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
      </div>
    </div>
  );
};

export default Top100CoursesHubPanel;
