import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Check, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrowseCourseCard from './BrowseCourseCard';
import type { StatBrowseRow } from './useStatBrowse';
import { RailChips, railChipStyle, RailChipTrigger, APPLIED_FILL, RAIL_CHIP_WEIGHT } from '@/components/ui/RailChips';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { communityOrder } from './top100/communityOrder';
import { PageLoadGate, usePageRevealed, useSectionReady } from './browse/PageLoadGate';
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
import { ArgumentShell, Top100CardListShell, YourHundredShell } from './top100/top100Shells';

/** Gap between cards in the Top 100 list; its shell reads this (BRIEF_COURSES_SKELETONS_3A). */
export const TOP100_CARD_GAP = 24;
import { argumentGroups, qualifyingCount } from './top100/theArgument';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100GolferBaseline } from '@/hooks/top100/useTop100GolferBaseline';

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

type Top100Ranking = 'official' | 'community';
const RANKING_OPTIONS: Array<{ value: Top100Ranking; label: string }> = [
  { value: 'official', label: 'Official rating' },
  { value: 'community', label: 'Community rating' },
];

function savedRanking(): Top100Ranking {
  try {
    return JSON.parse(sessionStorage.getItem('top100-last-filters') ?? '{}')?.ranking === 'community' ? 'community' : 'official';
  } catch {
    return 'official';
  }
}

function savedList(): string {
  try {
    const value = JSON.parse(sessionStorage.getItem('top100-last-filters') ?? '{}')?.list;
    return LISTS.some((list) => list.id === value) ? value : 'global';
  } catch {
    return 'global';
  }
}

/** The list holding the member's most played courses — a single clear
 *  leader with more than zero, otherwise 'global'. Unknown slugs are ignored. */
export function mostPlayedList(lists: ReadonlyArray<{ listSlug: string; played: number }> | undefined): string {
  let best = 0;
  let leaders: string[] = [];
  for (const row of lists ?? []) {
    if (!LISTS.some((list) => list.id === row.listSlug)) continue;
    const played = Number(row.played ?? 0);
    if (played > best) { best = played; leaders = [row.listSlug]; }
    else if (played === best && played > 0) leaders.push(row.listSlug);
  }
  return leaders.length === 1 && best > 0 ? leaders[0] : 'global';
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
}

const Top100CoursesHubPanel: React.FC<Props> = ({ shellTabs }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedList, setSelectedList] = useState(savedList);
  const [ranking, setRanking] = useState<Top100Ranking>(savedRanking);
  const [searchOpen, setSearchOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const restored = useRef(false);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useGolfCoursesInfinite({ listSlug: selectedList });
  /* The slug the RENDERED rows belong to. While a region switch is in flight
     the previous list stays on screen (keepPreviousData), so rows must be read
     against the list they came from, not the chip just tapped. */
  const settledList = useRef(selectedList);
  if (!isPlaceholderData) settledList.current = selectedList;
  const renderedList = settledList.current;

  const chosenThisMount = useRef(false);
  const defaultApplied = useRef(false);
  const chooseList = (next: string) => {
    restored.current = true;
    chosenThisMount.current = true;
    sessionStorage.setItem('top100-last-filters', JSON.stringify({ list: next, ranking }));
    setSelectedList(next);
  };
  const chooseRanking = (next: Top100Ranking) => {
    sessionStorage.setItem('top100-last-filters', JSON.stringify({ list: selectedList, ranking: next }));
    setRanking(next);
  };

  const courses = useMemo(() => {
    const rows = data?.pages.flat() ?? [];
    return [...rows].sort((a, b) => (rankFor(a, renderedList) ?? 999) - (rankFor(b, renderedList) ?? 999));
  }, [data, renderedList]);
  const ids = useMemo(() => courses.map((course) => course.id), [courses]);
  const { data: enrichment, isLoading: enrichmentLoading } = useTop100Enrichment(ids, user?.id, renderedList);
  const visibleCourses = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) => (course.name ?? '').toLowerCase().includes(q));
  }, [courses, nameQuery]);
  /* Community order is computed on the FULL list, then search filters each
     group, so a search never renumbers positions. */
  const community = useMemo(
    () => communityOrder(
      courses,
      (c) => ({ rating: enrichment.get(c.id)?.rating ?? null, ratingCount: enrichment.get(c.id)?.ratingCount ?? 0 }),
      (c) => rankFor(c, renderedList),
      (c) => c.name ?? '',
    ),
    [courses, enrichment, renderedList],
  );
  const matchesQuery = (course: SearchedCourseWithRating) => {
    const q = nameQuery.trim().toLowerCase();
    return !q || (course.name ?? '').toLowerCase().includes(q);
  };
  const communityRated = community.rated.filter(({ course }) => matchesQuery(course));
  const communityUnrated = community.unrated.filter(matchesQuery);
  const communityPending = enrichmentLoading && !courses.some((course) => enrichment.has(course.id));
  const renderCard = (course: SearchedCourseWithRating, rank: number | null, gapBelow: boolean, withOfficial: boolean) => {
    const item = enrichment.get(course.id);
    const row = toBrowseRow(course, item, renderedList);
    // The id is an anchor with no current consumer, kept for deep links.
    return (
      <div key={course.id} id={`top100-card-${course.id}`} style={{ scrollMarginTop: 'max(env(safe-area-inset-top, 0px), 47px)', marginBottom: gapBelow ? TOP100_CARD_GAP : 0 }}>
        <BrowseCourseCard
          row={row}
          variant="top100"
          rank={rank}
          officialRank={withOfficial ? rankFor(course, renderedList) : undefined}
          viewerRounds={item?.yourRounds ?? 0}
          viewerBest={item?.yourBest ?? null}
          recordHolder={item?.recordHolder ?? null}
          players={item?.players ?? []}
          difficultyPercentile={row.rounds > 0 ? row.difficulty_percentile : null}
          onClick={() => openCourse(course.id)}
        />
      </div>
    );
  };
  const heading = LIST_NAMES[renderedList] ?? 'Top 100';
  /* VIEWER counts. Played and the denominator come from the per-list row of
     user_top100_progress_view for the ACTIVE scope — never the global total and
     never a typed 100. Rated is the server's courses_rated_in_list for the active list. */
  const {
    data: progress,
    isLoading: progressLoading,
    isFetchedAfterMount: progressFetchedAfterMount,
  } = useTop100ProgressForUser(user?.id);
  const viewerList = progress?.lists.find((list) => list.listSlug === renderedList);
  const viewerPlayed = viewerList?.played ?? 0;
  const viewerRated = viewerList?.rated ?? 0;

  /* The tab opens where the member's golf is. This runs ONCE, only when nothing has been chosen — a saved list or a tap in this mount both win over it, because a default that overrides a member's own choice is not a default, it is a bug. A tie for the most played, or none played at all, falls back to Global. It is safe to change the list here because PageLoadGate is already waiting on 'progress', so the page has not painted yet. */
  useEffect(() => {
    if (!user?.id || progressLoading || !progress) return;
    if (sessionStorage.getItem('top100-last-filters') != null) return;
    if (chosenThisMount.current || defaultApplied.current) return;
    defaultApplied.current = true;
    setSelectedList(mostPlayedList(progress.lists));
  }, [user?.id, progress, progressLoading]);
  const subjects = useMemo(
    () => new Map(courses.map((c) => [c.id, {
      name: c.name ?? '',
      imageUrl: c.thumbnail_image ?? null,
      memberships: ((c.list_memberships ?? []) as CourseListMembership[]).map((m) => ({ list_slug: m.list_slug, rank: Number(m.rank) })),
    }])),
    [courses],
  );
  const argumentInputs = courses.map((c) => {
    const e = enrichment.get(c.id);
    return { id: c.id, name: c.name ?? '', imageUrl: c.thumbnail_image ?? null, publishedRank: rankFor(c, renderedList), rating: e?.rating ?? null, ratingCount: e?.ratingCount ?? 0 };
  });
  const { higher: argumentHigher, lower: argumentLower } = argumentGroups(argumentInputs);
  const argumentQualifying = qualifyingCount(argumentInputs);
  /* BRIEF_TOP100_MONTHLY_MOVE: the golfers' order four weeks ago, for the
     list the rows on screen belong to. Empty while loading or on error — the
     section never waits on it. */
  const argumentBaseline = useTop100GolferBaseline(renderedList);
  const listSectionRef = useRef<HTMLElement | null>(null);
  /* "See the golfers' list": switch the ranking and bring The list into view. */
  const seeGolfersList = () => {
    chooseRanking('community');
    listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const revealed = usePageRevealed();
  useEffect(() => {
    if (!revealed || restored.current || courses.length === 0) return;
    const value = sessionStorage.getItem('top100-scroll');
    restored.current = true;
    if (!value) return;
    requestAnimationFrame(() => scrollPageTo(Number(value), 'instant'));
    sessionStorage.removeItem('top100-scroll');
  }, [courses.length, revealed]);

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
          onChange={chooseList}
          ariaLabel="Top 100 region"
          align="center-when-fit"
          size="sm"
          trailing={(
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
          )}
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
      <PageLoadGate expect={TOP100_GATE_IDS}>
      <GateReport id="list" ready={!isLoading} />
      {/* isLoading false does not mean the server has answered — it means we have something to draw. For a member's own figures those are different things, and the gap between them is how a member gets shown last season's totals with no loading state. */}
      <GateReport id="progress" ready={user?.id ? progressFetchedAfterMount : !progressLoading} />
      <GateReport id="enrichment" ready={!enrichmentLoading} />
      {/* HUNDRED_FIT_1 AXA9/10: below five played on the ACTIVE list the section
          is absent entirely — no heading, figure, grid, legend or placeholder —
          and the skeleton must not reserve the space either. viewerPlayed already
          arrives per-list for the active scope, so this re-evaluates with the chips. */}
      {user && viewerList && viewerList.total > 0 && courses.length > 0 && viewerPlayed >= 5 ? (
        <YourHundredSection
          listSlug={renderedList}
          viewerPlayed={viewerPlayed}
          total={viewerList.total}
          courseIds={ids}
          enrichment={enrichment}
          subjects={subjects}
          onOpenCourse={openCourse}
        />
      ) : user && (isLoading || (user?.id ? !progressFetchedAfterMount : progressLoading)) && (!progressFetchedAfterMount || viewerPlayed >= 5) ? (
        <YourHundredShell />
      ) : null}
      {argumentHigher.length + argumentLower.length > 0 ? (
        <TheArgumentSection
          higher={argumentHigher}
          lower={argumentLower}
          qualifying={argumentQualifying}
          showGolfersLink={ranking !== 'community'}
          onSeeGolfersList={seeGolfersList}
          baseline={argumentBaseline}
        />
      ) : isLoading || enrichmentLoading ? (
        <ArgumentShell />
      ) : null}
      <section ref={listSectionRef} style={{ ...SECTION_WRAP, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <SectionHead kicker="The list" tone="quiet" title={heading} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RailChipTrigger label={ranking === 'community' ? 'Community rating' : 'Official rating'} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {RANKING_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => chooseRanking(opt.value)}
                  className="text-sm"
                  style={
                    ranking === opt.value
                      ? { background: APPLIED_FILL, color: A.INK, fontWeight: RAIL_CHIP_WEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
                      : undefined
                  }
                >
                  {opt.label}
                  {ranking === opt.value ? <Check size={14} color={A.INK} aria-hidden /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {ranking === 'community' ? (
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4, color: A.DIM }}>
            Ranked by clbhouz members' average rating.
          </div>
        ) : null}
      </section>

      <div style={{ paddingTop: 24 }}>
        {isLoading || (ranking === 'community' && communityPending) ? <Top100CardListShell /> : isError ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: A.MUTE }}>
            <Award size={20} aria-hidden />
            <p>Could not load this list.</p>
            <button type="button" onClick={() => refetch()} style={{ color: A.INK, fontWeight: 700 }}>Retry</button>
          </div>
        ) : ranking === 'community' ? (
          <div>
            {nameQuery.trim().length > 0 && communityRated.length === 0 && communityUnrated.length === 0 ? (
              <div style={{ padding: '0 16px', color: A.MUTE, fontSize: 13 }}>
                {`No course on this list matches ${nameQuery.trim()}.`}
              </div>
            ) : null}
            {communityRated.map(({ course, position }, index) =>
              renderCard(course, position, index < communityRated.length - 1, true))}
            {communityUnrated.length > 0 ? (
              <section
                style={{
                  ...(communityRated.length > 0 ? { marginTop: 40, borderTop: `1px solid ${A.TRACK}` } : {}),
                  padding: '20px 16px 0',
                }}
              >
                <SectionHead kicker="Not yet rated" tone="quiet" />
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4, color: A.DIM }}>
                  {`${communityUnrated.length} ${communityUnrated.length === 1 ? 'course' : 'courses'} no member has rated, in official order.`}
                </div>
              </section>
            ) : null}
            {communityUnrated.length > 0 ? (
              <div style={{ paddingTop: 24 }}>
                {communityUnrated.map((course, index) =>
                  renderCard(course, null, index < communityUnrated.length - 1, true))}
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            {nameQuery.trim().length > 0 && visibleCourses.length === 0 ? (
              <div style={{ padding: '0 16px', color: A.MUTE, fontSize: 13 }}>
                {`No course on this list matches ${nameQuery.trim()}.`}
              </div>
            ) : null}
            {visibleCourses.map((course, index) =>
              renderCard(course, rankFor(course, renderedList), index < visibleCourses.length - 1, false))}
          </div>
        )}
      </div>
      </PageLoadGate>
      <div aria-hidden style={{ height: 'calc(var(--bottom-nav-height, 96px) + 16px)' }} />
    </div>
  );
};

export default Top100CoursesHubPanel;

const TOP100_GATE_IDS = ['list', 'progress', 'enrichment'] as const;

/** Reports panel-owned readiness from inside the gate's context. */
function GateReport({ id, ready }: { id: string; ready: boolean }) {
  useSectionReady(id, ready);
  return null;
}