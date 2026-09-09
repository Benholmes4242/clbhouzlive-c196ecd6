import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrowseCourseCard from './BrowseCourseCard';
import type { StatBrowseRow } from './useStatBrowse';
import { RailChips } from '@/components/ui/RailChips';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useGolfCoursesInfinite, type SearchedCourseWithRating } from '@/hooks/useGolfCoursesInfinite';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useTop100Enrichment, type Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import type { CourseListMembership } from '@/hooks/useGolfCoursesSearch';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { COURSE_BROWSE_DESCRIPTION } from './courseBrowseTypography';

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
    members: 0,
    avg_to_par: hasRounds ? data?.avgOverPar ?? null : null,
    total_yards: null,
    tee_label: null,
    course_record: null,
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
  const restored = useRef(false);
  const { data: summaries = [] } = useTop100ListSummaries(user?.id);
  const { data, isLoading, isError, refetch } = useGolfCoursesInfinite({ listSlug: selectedList });

  useEffect(() => {
    sessionStorage.setItem('top100-last-filters', JSON.stringify({ list: selectedList }));
  }, [selectedList]);

  const courses = useMemo(() => {
    const rows = data?.pages.flat() ?? [];
    return [...rows].sort((a, b) => (rankFor(a, selectedList) ?? 999) - (rankFor(b, selectedList) ?? 999));
  }, [data, selectedList]);
  const ids = useMemo(() => courses.map((course) => course.id), [courses]);
  const enrichment = useTop100Enrichment(ids, user?.id, selectedList);
  const ratedCount = courses.filter((course) => {
    const item = enrichment.get(course.id);
    return item?.rating != null && item.ratingCount > 0;
  }).length;
  const playedCount = courses.filter((course) => (enrichment.get(course.id)?.roundsTracked ?? 0) > 0).length;
  const total = summaries.find((summary) => summary.slug === selectedList)?.total_courses ?? courses.length;
  const heading = LIST_NAMES[selectedList] ?? 'Top 100';
  const ratingSentence = `${ratedCount} of the ${total} ${total === 1 ? 'course' : 'courses'} ${ratedCount === 1 ? 'carries' : 'carry'} a rating.`;
  const roundSentence = `${playedCount} ${playedCount === 1 ? 'has' : 'have'} a tracked round.`;

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
      <section style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
          <h2 style={{ margin: 0, color: A.INK, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{heading}</h2>
          <span style={{ color: A.MUTE, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{ratedCount} rated</span>
        </div>
        <p style={{ ...COURSE_BROWSE_DESCRIPTION, margin: '10px 0 16px' }}>
          {ratingSentence} {roundSentence}
        </p>
        <RailChips
          options={LISTS}
          value={selectedList}
          onChange={(next) => { restored.current = true; setSelectedList(next); }}
          ariaLabel="Top 100 region"
          ground="outline"
          align="center-when-fit"
        />
        {rateNudge ? <div style={{ marginTop: 24 }}>{rateNudge}</div> : null}
      </section>

      <div style={{ padding: '24px 20px 0' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gap: 32 }}>
            {[1, 2, 3].map((key) => <Skeleton key={key} style={{ height: 178, borderRadius: 0 }} />)}
          </div>
        ) : isError ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: A.MUTE }}>
            <Award size={20} aria-hidden />
            <p>Could not load this list.</p>
            <button type="button" onClick={() => refetch()} style={{ color: A.INK, fontWeight: 700 }}>Retry</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 32 }}>
            {courses.map((course) => {
              const item = enrichment.get(course.id);
              const row = toBrowseRow(course, item, selectedList);
              return (
                <BrowseCourseCard
                  key={course.id}
                  row={row}
                  variant="top100"
                  rank={rankFor(course, selectedList)}
                  viewerRounds={item?.yourRounds ?? 0}
                  difficultyPercentile={row.rounds > 0 ? row.difficulty_percentile : null}
                  ratedWithoutRoundsNote="Rated, but nobody has tracked a round here yet."
                  onClick={() => openCourse(course.id)}
                />
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