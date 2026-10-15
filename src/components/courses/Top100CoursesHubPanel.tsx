import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrowseCourseCard from './BrowseCourseCard';
import type { StatBrowseRow } from './useStatBrowse';
import { RAIL_CHIP_GAP, RailChips, railChipStyle } from '@/components/ui/RailChips';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Enrichment, type Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import type { CourseListMembership } from '@/hooks/useGolfCoursesSearch';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CoursesSearchField } from '@/features/explore-magazine/CoursesSearchField';
import { SectionHead, SECTION_WRAP } from './browse/SectionHead';
import { YourHundredSection } from './top100/YourHundredSection';
import { TheArgumentSection } from './top100/TheArgumentSection';
import { argumentRows, qualifyingCount } from './top100/theArgument';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';

const LISTS = [
  { id: 'global', label: 'Global' },
  { id: 'gb-i', label: 'GB&I' },
  { id: 'europe', label: 'Europe' },
  { id: 'usa', label: 'USA' },
] as const;

const LIST_NAMES: Record<string, string> = {
  global: 'Global Top 100',
  'gb-i': 'GB&I Top 100',
  europe: 'Europe Top 100',
  usa: 'USA Top 100',
};

function savedList(): string {
  try {
    const value = JSON.parse(sessionStorage.getItem('top100-last-filters') ?? '{}')?.list;
    return LISTS.some((list) => list.id === value) ? value : 'global';
  } catch {
    return 'global';
  }
}

function rankFor(course: SearchedCourseWithRating, list: string): number | null {
  const match = (course.list_memberships ?? []).find((membership: CourseListMembership) => membership.list_slug === list);
  return match?.rank ?? null;
}

function toBrowseRow(
  course: SearchedCourseWithRating,
  data: Top100Enrichment | undefined,
  list: string,
): StatBrowseRow {
  const hasRounds = (data?.roundsTracked ?? 0) > 0;
  return {
    course_id: course.id,
    name: course.name,
    region: course.region ?? null,
    sub_country: course.sub_country ?? null,
    country: course.country,
    image_url: course.thumbnail_image ?? null,
    community_rating: data?.rating ?? null,
    review_count: data?.ratingCount ?? 0,
    global_rank: course.global_rank ?? null,
    regional_rank: course.regional_rank ?? null,
    rounds: data?.roundsTracked ?? 0,
    members: data?.playerCount ?? 0,
    avg_to_par: hasRounds ? data?.avgOverPar ?? null : null,
    total_yards: null,
    tee_label: null,
    course_record: data?.recordGross ?? null,
    open_crowns: 0,
    total_count: 0,
    design_score: hasRounds ? data?.subScores.design ?? null : null,
    condition_score: hasRounds ? data?.subScores.condition ?? null : null,
    clubhouse_score: hasRounds ? data?.subScores.clubhouse ?? null : null,
    facilities_score: hasRounds ? data?.subScores.facilities ?? null : null,
    difficulty_percentile: hasRounds ? data?.harderThanPct ?? null : null,
    memberships: rankFor(course, list) == null ? [] : [{ list_slug: list, rank: rankFor(course, list) as number }],
  };
}

interface Props {
  shellTabs?: React.ReactNode;
  rateNudge?: React.ReactNode;
}

const Top100CoursesHubPanel: React.FC<Props> = ({ shellTabs, rateNudge }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedList, setSelectedList] = useState(savedList);
  const [searchOpen, setSearchOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [yoursOnly, setYoursOnly] = useState(false);
  const restored = useRef(false);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useGolfCoursesInfinite({ listSlug: selectedList });
  /* The slug the RENDERED rows belong to. While a region switch is in flight
     the previous list stays on screen (keepPreviousData), so rows must be read
     against the list they came from, not the chip just tapped. */
  const settledList = useRef(selectedList);
  if (!isPlaceholderData) settledList.current = selectedList;
  const renderedList = settledList.current;

  useEffect(() => {
    sessionStorage.setItem('top100-last-filters', JSON.stringify({ list: selectedList }));
  }, [selectedList]);

  const courses = useMemo(() => {
    const rows = data?.pages.flat() ?? [];
    return [...rows].sort((a, b) => (rankFor(a, renderedList) ?? 999) - (rankFor(b, renderedList) ?? 999));
  }, [data, renderedList]);
  const ids = useMemo(() => courses.map((course) => course.id), [courses]);
  const enrichment = useTop100Enrichment(ids, user?.id, renderedList);
  /* Search and "Yours" narrow what is rendered only (client-side, no query).
     The head's rated / tracked meta describes the whole list, so it keeps
     counting the unfiltered rows. */
  const visibleCourses = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return courses.filter((course) => {
      if (q && !(course.name ?? '').toLowerCase().includes(q)) return false;
      if (yoursOnly) {
        const e = enrichment.get(course.id);
        if (!((e?.yourRounds ?? 0) > 0 || e?.ratedByYou)) return false;
      }
      return true;
    });
  }, [courses, nameQuery, yoursOnly, enrichment]);
  /* COMMUNITY counts: how many of the list ANYONE has rated / played. Not to be
     confused with the VIEWER counts below (BRIEF_TOP_100_REBUILD §2). */
  const communityRatedCount = courses.filter((course) => {
    const item = enrichment.get(course.id);
    return item?.rating != null && item.ratingCount > 0;
  }).length;
  const communityPlayedCount = courses.filter((course) => (enrichment.get(course.id)?.roundsTracked ?? 0) > 0).length;
  const heading = LIST_NAMES[renderedList] ?? 'Top 100';
  /* VIEWER counts. Played and the denominator come from the per-list row of
     user_top100_progress_view for the ACTIVE scope — never the global total and
     never a typed 100. Rated is the server's courses_rated_in_list for the active list. */
  const { data: progress } = useTop100ProgressForUser(user?.id);
  const viewerList = progress?.lists.find((list) => list.listSlug === renderedList);
  const viewerPlayed = viewerList?.played ?? 0;
  const viewerRated = viewerList?.rated ?? 0;
  const courseNames = useMemo(() => new Map(courses.map((c) => [c.id, c.name ?? ''])), [courses]);
  const argumentInputs = courses.map((c) => {
    const e = enrichment.get(c.id);
    return { id: c.id, name: c.name ?? '', imageUrl: c.thumbnail_image ?? null, publishedRank: rankFor(c, renderedList), rating: e?.rating ?? null, ratingCount: e?.ratingCount ?? 0 };
  });
  const argument = argumentRows(argumentInputs);
  const argumentQualifying = qualifyingCount(argumentInputs);
  const jumpToCard = (courseId: string) => {
    if (nameQuery) setNameQuery('');
    requestAnimationFrame(() => {
      document.getElementById(`top100-card-${courseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (restored.current || courses.length === 0) return;
    const value = sessionStorage.getItem('top100-scroll');
    restored.current = true;
    if (!value) return;
    requestAnimationFrame(() => scrollPageTo(Number(value), 'instant'));
    sessionStorage.removeItem('top100-scroll');
  }, [courses.length]);

  const openCourse = (courseId: string) => {
    sessionStorage.setItem('top100-scroll', String(getPageScrollTop()));
    navigate(`/courses/${courseId}`);
  };

  return (
    <div>
      {shellTabs}
      <div style={{ padding: '0 16px' }}>
        <RailChips
          options={LISTS}
          value={selectedList}
          onChange={(next) => { restored.current = true; setSelectedList(next); }}
          ariaLabel="Top 100 region"
          align="center-when-fit"
          size="sm"
          trailing={(<span style={{ display: 'flex', gap: RAIL_CHIP_GAP }}>
            <button
              type="button"
              onClick={() => {
                if (searchOpen) setNameQuery('');
                setSearchOpen((prev) => !prev);
              }}
              aria-label="Search this list"
              aria-expanded={searchOpen}
              style={{
                ...railChipStyle(searchOpen, 'sm'),
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {searchOpen ? (
                <X className="h-4 w-4" style={{ color: 'currentColor' }} aria-hidden />
              ) : (
                <Search className="h-4 w-4" style={{ color: 'currentColor' }} aria-hidden />
              )}
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => setYoursOnly((prev) => !prev)}
                aria-pressed={yoursOnly}
                style={{ ...railChipStyle(yoursOnly, 'sm'), alignSelf: 'stretch' }}
              >
                Yours
              </button>
            ) : null}
          </span>)}
        />
        {searchOpen ? (
          <div style={{ marginTop: 10 }}>
            <CoursesSearchField
              value={nameQuery}
              onChange={setNameQuery}
              padding="0"
              autoFocus
              placeholder="Search these courses"
            />
          </div>
        ) : null}
      </div>
      {user && viewerList && viewerList.total > 0 && courses.length > 0 ? (
        <YourHundredSection
          viewerPlayed={viewerPlayed}
          total={viewerList.total}
          courseIds={ids}
          enrichment={enrichment}
          courseNames={courseNames}
          onCellTap={jumpToCard}
        />
      ) : null}
      {argument.length > 0 ? <TheArgumentSection rows={argument} qualifying={argumentQualifying} /> : null}
      <section style={{ ...SECTION_WRAP, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <SectionHead kicker="The list" tone="quiet" title={heading} />
          <span style={{ color: A.MUTE, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {communityRatedCount} reviewed · {communityPlayedCount} tracked
          </span>
        </div>
        {rateNudge ? <div style={{ marginTop: 24 }}>{rateNudge}</div> : null}
      </section>

      <div style={{ paddingTop: 24 }}>
        {isLoading ? (
          <div style={{ display: 'grid', gap: 32 }}>
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="w-full aspect-[16/9.5]" style={{ borderRadius: 0 }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: A.MUTE }}>
            <Award size={20} aria-hidden />
            <p>Could not load this list.</p>
            <button type="button" onClick={() => refetch()} style={{ color: A.INK, fontWeight: 700 }}>Retry</button>
          </div>
        ) : (
          <div>
            {nameQuery.trim().length > 0 && visibleCourses.length === 0 ? (
              <div style={{ padding: '0 16px', color: A.MUTE, fontSize: 13 }}>
                {`No course on this list matches ${nameQuery.trim()}.`}
              </div>
            ) : null}
            {visibleCourses.map((course, index) => {
              const item = enrichment.get(course.id);
              const row = toBrowseRow(course, item, renderedList);
              return (
                <div key={course.id} id={`top100-card-${course.id}`} style={{ scrollMarginTop: 'max(env(safe-area-inset-top, 0px), 47px)', marginBottom: index < visibleCourses.length - 1 ? 32 : 0 }}>
                  <BrowseCourseCard
                    row={row}
                    variant="top100"
                    rank={rankFor(course, renderedList)}
                    viewerRounds={item?.yourRounds ?? 0}
                    viewerBest={item?.yourBest ?? null}
                    recordHolder={item?.recordHolder ?? null}
                    players={item?.players ?? []}
                    difficultyPercentile={row.rounds > 0 ? row.difficulty_percentile : null}
                    onClick={() => openCourse(course.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div aria-hidden style={{ height: 'calc(var(--bottom-nav-height, 96px) + 16px)' }} />
    </div>
  );
};

export default Top100CoursesHubPanel;