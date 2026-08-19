import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import type { CourseListMembership } from '@/hooks/useGolfCoursesSearch';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Search, Award, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import VirtualizedCourseList from './VirtualizedCourseList';
import { KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { FilterChips } from '@/components/ui/FilterChips';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, INK, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';
import { useNavigate } from 'react-router-dom';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { useTop100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import { useTop100Movers, type MoverRange } from '@/hooks/top100/useTop100Movers';

import { computeVerdict, type Verdict } from '@/components/top100/verdict';
import { Top100EnrichmentBlock } from '@/components/top100/Top100EnrichmentBlock';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Top100MoversSection } from '@/components/top100/Top100MoversSection';
import { Top100MoversSheet } from '@/components/top100/sheets/Top100MoversSheet';
import { Top100VerdictExplainerSheet } from '@/components/top100/sheets/Top100VerdictExplainerSheet';

/** Known Top 100 list slugs for validation. */
const KNOWN_LIST_SLUGS = ['global', 'gb-i', 'usa', 'europe'];

/** Read saved Top 100 filters from sessionStorage (parsed once, shared by initialisers). */
function readSavedFilters(): { list?: string; searchTerm?: string } | null {
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

  // Scroll restoration ref
  const hasRestoredScroll = useRef(false);

  // Fetch data
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: lists = [] } = useTop100Lists();

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
        searchTerm,
      }));
    } catch { /* ignore */ }
  }, [selectedList, searchTerm]);

  // Fetch courses
  const {
    data: coursesData,
    isLoading,
    isError,
    refetch,
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten and sort courses (official ranking only) — attach displayRank reflecting list position
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
        const m = memberships.find((x: CourseListMembership) => x.list_slug.includes(matcher));
        return m?.rank ?? 999;
      }
      return memberships[0]?.rank ?? 999;
    };

    // Official ranking — pre-extract rank keys so the comparator is O(1)
    const withRankKey = courses.map((c) => ({
      course: c,
      rankKey: getRankForSelectedList(c),
    }));

    withRankKey.sort((a, b) => a.rankKey - b.rankKey);

    return withRankKey.map((x, idx) => ({ ...x.course, displayRank: idx + 1 }));
  }, [coursesData, selectedList]);

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

  const handleResetFilters = () => {
    setSelectedList('global');
    setSearchTerm('');
  };

  // Active list short label (used for placeholder + meta row)
  const activeListShortLabel = (() => {
    const opt = listOptions.find(o => o.value === selectedList);
    if (!opt) return 'Top 100';
    return opt.label.replace(/\s*Top 100\s*$/, '').trim();
  })();
  // ── Enrichment ────────────────────────────────────────────────────────────
  // One batched fetch for the whole loaded page set — never per card.
  const verdictConfig = useTop100Config();
  const courseIds = React.useMemo(() => allCourses.map((c) => c.id), [allCourses]);
  const enrichment = useTop100Enrichment(
    courseIds,
    user?.id,
    // Stable scope, never a hash of the id set: list slug + active search.
    `${selectedList}|${searchTerm.trim().toLowerCase()}`,
  );
  const { data: progressLists = [] } = useUserTop100Progress(user?.id);

  const [moverRange, setMoverRange] = useState<MoverRange>('this_month');
  const { data: movers = [] } = useTop100Movers(moverRange);

  const [moversSheetOpen, setMoversSheetOpen] = useState(false);
  const [verdictSheet, setVerdictSheet] = useState<
    {
      courseId: string;
      courseName: string;
      verdict: Verdict;
      canRate: boolean;
      listCount: number;
      ratingRank: number | null;
      ratingPoolSize: number | null;
    } | null
  >(null);

  // Rank within the list currently on screen, keyed for O(1) lookup.
  const rankMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const course of allCourses) {
      const memberships = (course.list_memberships ?? []) as CourseListMembership[];
      const match = memberships.find((m) => m.list_slug.includes(selectedList));
      const rank = match?.rank ?? course.displayRank ?? null;
      if (rank != null) map.set(course.id, rank);
    }
    return map;
  }, [allCourses, selectedList]);

  const ratedCourseIds = React.useMemo(() => {
    const set = new Set<string>();
    enrichment.forEach((value, id) => {
      if (value.ratedByYou) set.add(id);
    });
    return set;
  }, [enrichment]);

  const courseNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const course of allCourses) map.set(course.id, course.name);
    return map;
  }, [allCourses]);

  const verdictFor = React.useCallback(
    (courseId: string): Verdict | null => {
      const data = enrichment.get(courseId);
      if (!data) return null;
      return computeVerdict({
        rank: rankMap.get(courseId) ?? null,
        rating: data.rating,
        ratingCount: data.ratingCount,
        config: verdictConfig,
      });
    },
    [enrichment, rankMap, verdictConfig],
  );

  const viewerStatusFor = React.useCallback(
    (courseId: string): 'rated' | 'played' | null => {
      const data = enrichment.get(courseId);
      if (!data) return null;
      if (data.ratedByYou) return 'rated';
      return data.yourRounds > 0 ? 'played' : null;
    },
    [enrichment],
  );

  /**
   * Standing on member ratings WITHIN the selected list, restricted to the
   * same minRatings pool the verdict band itself uses so the number can never
   * contradict the sentence above it. Computed from allCourses, never from the
   * rendered or paginated subset. Tiebreak is ratingCount DESC: on equal
   * ratings the more widely rated course goes above.
   */
  const ratingRankMap = React.useMemo(() => {
    const pool: { id: string; rating: number; count: number }[] = [];
    for (const course of allCourses) {
      const memberships = (course.list_memberships ?? []) as CourseListMembership[];
      const inList = memberships.some((m) => m.list_slug.includes(selectedList));
      if (!inList && memberships.length > 0) continue;
      const data = enrichment.get(course.id);
      if (!data || data.rating == null) continue;
      if (data.ratingCount < verdictConfig.minRatings) continue;
      pool.push({ id: course.id, rating: data.rating, count: data.ratingCount });
    }
    /* Final id tiebreak mirrors get_course_rating_standing so the Courses tab
       and this tab can never disagree on a position. */
    pool.sort((a, b) => b.rating - a.rating || b.count - a.count || a.id.localeCompare(b.id));
    const map = new Map<string, { position: number; poolSize: number }>();
    pool.forEach((entry, index) => {
      map.set(entry.id, { position: index + 1, poolSize: pool.length });
    });
    return map;
  }, [allCourses, selectedList, enrichment, verdictConfig.minRatings]);

  const renderEnrichment = React.useCallback(
    (courseId: string) => {
      const data = enrichment.get(courseId);
      const verdict = verdictFor(courseId);
      const courseName = courseNameById.get(courseId) ?? null;
      return (
        <Top100EnrichmentBlock
          courseId={courseId}
          courseName={courseName}
          rank={rankMap.get(courseId) ?? null}
          list={selectedList}
          data={data}
          verdict={verdict}
          ratingRank={ratingRankMap.get(courseId) ?? null}
          listLabel={activeListShortLabel}
          onOpenVerdict={() => {
            if (!verdict || !courseName) return;
            const standing = ratingRankMap.get(courseId) ?? null;
            const course = allCourses.find((c) => c.id === courseId);
            const memberships = (course?.list_memberships ?? []) as CourseListMembership[];
            setVerdictSheet({
              courseId,
              courseName,
              verdict,
              canRate: !!data && !data.ratedByYou,
              listCount: memberships.length,
              ratingRank: standing?.position ?? null,
              ratingPoolSize: standing?.poolSize ?? null,
            });
          }}
          onRate={() => navigate(`/courses/${courseId}/rate`)}
        />
      );
    },
    [enrichment, verdictFor, courseNameById, rankMap, ratingRankMap, selectedList, activeListShortLabel, navigate, allCourses],
  );


  // Total courses in the active list — pulled from the per-list summaries
  const totalCoursesInActiveList =
    listSummaries.find(l => l.slug === selectedList)?.total_courses ?? allCourses.length;

  // Progress is scoped to the active list only. When the member has no row for
  // that list yet we synthesise a zero row so the panel still renders.
  const activeProgress: Top100ListProgress = React.useMemo(() => {
    const match = progressLists.find((l) => l.list_slug === selectedList);
    if (match) return match;
    const fallbackName =
      listOptions.find((o) => o.value === selectedList)?.label ?? 'Top 100';
    return {
      list_id: selectedList,
      list_slug: selectedList,
      list_name: fallbackName,
      total: totalCoursesInActiveList,
      played: 0,
      rated: 0,
    };
  }, [progressLists, selectedList, totalCoursesInActiveList, listOptions]);

  // Below the configured threshold the progress panel is suppressed entirely.
  const progressHidden = activeProgress.played < verdictConfig.minPlayed;
  useEffect(() => {
    if (!progressHidden) return;
    analyticsEvents.track('t100_progress_hidden', {
      list: selectedList,
      played: activeProgress.played,
      min_played: verdictConfig.minPlayed,
    });
  }, [progressHidden, selectedList, activeProgress.played, verdictConfig.minPlayed]);

  return (
    <div>
      {/* SCOPE 1 — non-sticky: shell tabs + editorial header */}
      <div style={{ paddingBottom: 8 }}>
        {shellTabs}
        <div className="px-4 pt-2">
          {rateNudge}
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...KICKER, marginBottom: 5 }}>TOP 100</div>
            <h2
              style={{
                margin: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {t('top100.sectionTitle', { defaultValue: "The world's best" })}
            </h2>
          </div>
          {/* Provenance subhead — masthead-line mock */}
          <p
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              lineHeight: 1.45,
              maxWidth: 330,
              marginTop: 6,
              marginBottom: 12,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '-0.005em',
            }}
          >
            {t('top100.provenance', { defaultValue: "The top 100 courses in the world and in every region, as ranked by golf's leading publications." })}
          </p>

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
            padding: '4px 0 6px',
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

        <div className="px-4 space-y-4 pt-2">
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
          {!isError && (isLoading || allCourses.length > 0) && (
            <div className="flex items-center justify-between gap-3">
              {isLoading ? (
                <Skeleton className="h-4 w-44 rounded" />
              ) : (
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
              )}
            </div>
          )}

          {/* Member context — progress across lists, then where opinion moved */}
          {!searchTerm && !isLoading && !isError && (
            <div className="flex flex-col gap-3">
              {activeProgress.played >= verdictConfig.minPlayed && (
                <Top100ProgressPanel list={activeProgress} onOpenList={setProgressSheet} />
              )}
              <Top100MoversSection movers={movers} onViewAll={() => setMoversSheetOpen(true)} />
            </div>
          )}

          {/* Rankings List */}
          <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3 rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_7}` }}>
                  <Skeleton className="w-full aspect-[16/9.5] rounded-xl" />
                  <div className="space-y-2 px-4 pb-4">
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
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Award className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{t('top100.errorTitle', { defaultValue: "Couldn't load this list" })}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{t('top100.errorBody', { defaultValue: 'Check your connection and try again.' })}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
                style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
              >
                {t('top100.retry', { defaultValue: 'Retry' })}
              </button>
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
              viewerStatusFor={viewerStatusFor}
              renderEnrichment={renderEnrichment}
            />
          )}
          </div>
        </div>

        {/* Clears the floating bottom nav; 0px where it hides. */}
        <div
          aria-hidden="true"
          style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }}
        />
      </div>

      <Top100ListProgressSheet
        open={!!progressSheet}
        onClose={() => setProgressSheet(null)}
        listSlug={progressSheet?.list_slug ?? ''}
        listName={progressSheet?.list_name ?? ''}
        played={progressSheet?.played ?? 0}
        total={progressSheet?.total ?? 0}
        rated={progressSheet?.rated ?? 0}
        userId={user?.id}
        ratedCourseIds={ratedCourseIds}
      />

      <Top100MoversSheet
        open={moversSheetOpen}
        onClose={() => setMoversSheetOpen(false)}
        movers={movers}
        range={moverRange}
        onRangeChange={setMoverRange}
      />

      {verdictSheet && (
        <Top100VerdictExplainerSheet
          open
          onClose={() => setVerdictSheet(null)}
          courseId={verdictSheet.courseId}
          courseName={verdictSheet.courseName}
          listLabel={activeListShortLabel}
          rank={verdictSheet.verdict.rank}
          rating={verdictSheet.verdict.rating}
          ratingCount={verdictSheet.verdict.ratingCount}
          listCount={verdictSheet.listCount}
          ratingRank={verdictSheet.ratingRank}
          ratingPoolSize={verdictSheet.ratingPoolSize}
          canRate={verdictSheet.canRate}
          onRate={() => navigate(`/courses/${verdictSheet.courseId}/rate`)}
        />
      )}
    </div>
  );
};

export default Top100CoursesHubPanel;
