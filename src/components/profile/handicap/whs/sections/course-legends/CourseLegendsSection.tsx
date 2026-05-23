import React, { useMemo, useState } from 'react';
import { Crown } from 'lucide-react';
import { useUserPlayedCourses } from '@/hooks/gam/useUserPlayedCourses';
import { useUserHomeClubCourses } from '@/hooks/gam/useUserHomeClubCourses';
import { useDiscoverCoursesThisWeek } from '@/hooks/gam/useDiscoverCoursesThisWeek';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import {
  useCourseLegendHolders,
  type CourseLegendHolderRow,
} from '@/hooks/gam/useCourseLegendHolders';
import { useUserLegendTitleCount } from '@/hooks/gam/useUserLegendTitleCount';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import { legendCategoryWindow } from '@/lib/gam/visuals';
import CourseSearch from './_shared/CourseSearch';
import HomeClubSubsection from './subsections/HomeClubSubsection';
import YourCoursesSubsection from './subsections/YourCoursesSubsection';
import DiscoverSubsection from './subsections/DiscoverSubsection';
import SearchResultsSubsection from './subsections/SearchResultsSubsection';
import LegendPulseTicker from './LegendPulseTicker';
import type { CourseSelection } from './types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const AMBER = '#F7931E';
const GOLD_TINT = 'rgba(251,188,46,0.12)';

interface Props {
  userId: string;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const WindowToggle: React.FC<{
  window: LegendWindow;
  setWindow: (w: LegendWindow) => void;
}> = ({ window, setWindow }) => (
  <div
    style={{
      display: 'inline-flex',
      gap: 3,
      background: 'var(--hcp-bg-2, rgba(255,255,255,0.04))',
      border: '1px solid var(--hcp-line)',
      borderRadius: 999,
      padding: 3,
    }}
  >
    {([
      { v: '90d', label: '90D' },
      { v: 'all_time', label: 'All time' },
    ] as const).map((o) => {
      const active = window === o.v;
      return (
        <button
          key={o.v}
          type="button"
          onClick={() => setWindow(o.v)}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: active ? AMBER : 'transparent',
            color: active ? '#1A1300' : 'var(--hcp-t-60)',
            border: 'none',
            fontFamily: FONT,
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            minWidth: 56,
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

const SectionHero: React.FC<{
  titleCount: number;
  window: LegendWindow;
  setWindow: (w: LegendWindow) => void;
}> = ({ titleCount, window, setWindow }) => (
  <div
    style={{
      margin: '0 16px 20px',
      padding: 14,
      borderRadius: 14,
      background: `linear-gradient(135deg, ${GOLD_TINT} 0%, var(--hcp-bg-1) 70%)`,
      border: '1px solid rgba(251,188,46,0.25)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: FONT,
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: -22,
        bottom: -28,
        opacity: 0.13,
        color: GOLD,
        transform: 'rotate(-8deg)',
        pointerEvents: 'none',
      }}
    >
      <Crown size={130} strokeWidth={1.4} />
    </div>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          color: GOLD,
          letterSpacing: '0.16em',
          marginBottom: 8,
        }}
      >
        <Crown size={11} strokeWidth={2.4} />
        COURSE LEGENDS
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
        }}
      >
        {titleCount === 0
          ? 'Your legend starts here'
          : `You hold ${titleCount} title${titleCount === 1 ? '' : 's'}`}
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: 'var(--hcp-t-60)',
          marginTop: 4,
          marginBottom: 14,
        }}
      >
        {titleCount === 0
          ? 'Top the leaderboard at any course to earn your first title'
          : window === '90d'
            ? 'across rolling 90-day leaderboards'
            : 'across all-time course records'}
      </div>

      <WindowToggle window={window} setWindow={setWindow} />
    </div>
  </div>
);

export const CourseLegendsSection: React.FC<Props> = ({
  userId,
  onSelectCourse,
  friendName,
}) => {
  const [query, setQuery] = useState('');
  const [window, setWindow] = useState<LegendWindow>('90d');
  const playedQuery = useUserPlayedCourses(userId);
  const homeClubQuery = useUserHomeClubCourses(userId);
  const discoverQuery = useDiscoverCoursesThisWeek();
  const searchQuery = useCourseSearch(query);
  const { data: titleCount = 0 } = useUserLegendTitleCount(userId, window);

  const played = playedQuery.data ?? [];
  const homeClubCourses = homeClubQuery.data ?? [];
  const discover = discoverQuery.data ?? [];
  const showSearchResults = query.trim().length >= 2;

  // Dedupe played against home club
  const homeClubIds = useMemo(
    () => new Set(homeClubCourses.map((c) => c.course_id)),
    [homeClubCourses],
  );
  const playedFiltered = useMemo(
    () => played.filter((c) => !homeClubIds.has(c.course_id)),
    [played, homeClubIds],
  );

  // Batched holder fetch for non-search default view
  const allCourseIds = useMemo(() => {
    const ids = new Set<string>();
    homeClubCourses.forEach((c) => ids.add(c.course_id));
    playedFiltered.forEach((c) => ids.add(c.course_id));
    discover.forEach((c) => ids.add(c.course_id));
    return Array.from(ids);
  }, [homeClubCourses, playedFiltered, discover]);

  const { data: holderRows } = useCourseLegendHolders(userId, allCourseIds);

  // Build per-course holder map AND filter rows to the active window.
  const holdersByCourse = useMemo(() => {
    const map = new Map<string, Map<LegendCategory, CourseLegendHolderRow>>();
    (holderRows ?? []).forEach((row) => {
      if (legendCategoryWindow[row.category] !== window) return;
      let inner = map.get(row.course_id);
      if (!inner) {
        inner = new Map();
        map.set(row.course_id, inner);
      }
      inner.set(row.category, row);
    });
    return map;
  }, [holderRows, window]);

  return (
    <div>
      <SectionHero titleCount={titleCount} window={window} setWindow={setWindow} />

      {showSearchResults ? (
        <>
          <div style={{ margin: '4px 0 0' }}>
            <CourseSearch
              value={query}
              onChange={setQuery}
              helper="Find a course — see the legends"
            />
          </div>
          <SearchResultsSubsection
            query={query}
            results={searchQuery.data ?? []}
            isLoading={searchQuery.isLoading}
            isError={searchQuery.isError}
            onRetry={() => searchQuery.refetch()}
            onSelectCourse={onSelectCourse}
          />
        </>
      ) : (
        <>
          <LegendPulseTicker
            userId={userId}
            onSelectCourse={onSelectCourse}
            window={window}
          />
          <HomeClubSubsection
            userId={userId}
            holdersByCourse={holdersByCourse}
            onSelectCourse={onSelectCourse}
            friendName={friendName}
          />

          {/* Search bar repositioned: between HOME CLUB and YOUR COURSES */}
          <div style={{ margin: '4px 0 6px' }}>
            <CourseSearch
              value={query}
              onChange={setQuery}
              helper="Find a course — see the legends"
            />
          </div>

          <YourCoursesSubsection
            courses={playedFiltered}
            isLoading={playedQuery.isLoading}
            holdersByCourse={holdersByCourse}
            onSelectCourse={onSelectCourse}
            friendName={friendName}
          />
          <DiscoverSubsection
            courses={discover}
            isLoading={discoverQuery.isLoading}
            holdersByCourse={holdersByCourse}
            onSelectCourse={onSelectCourse}
            friendName={friendName}
          />
        </>
      )}
    </div>
  );
};

export default CourseLegendsSection;
