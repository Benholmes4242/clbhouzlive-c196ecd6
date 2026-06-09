import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Search } from 'lucide-react';
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
import HomeClubSubsection from './subsections/HomeClubSubsection';
import YourCoursesSubsection from './subsections/YourCoursesSubsection';
import DiscoverSubsection from './subsections/DiscoverSubsection';
import SearchResultsSubsection from './subsections/SearchResultsSubsection';
import LegendPulseTicker from './LegendPulseTicker';
import type { CourseSelection } from './types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';

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
      background: 'rgba(255,255,255,0.08)',
      border: '0.5px solid rgba(255,255,255,0.12)',
      borderRadius: 999,
      padding: 3,
    }}
  >
    {([
      { v: 'all_time', label: 'All time' },
      { v: '90d', label: '90D' },
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
            background: active ? '#FFFFFF' : 'transparent',
            color: active ? '#0A0E14' : 'var(--hcp-t-60)',
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
  friendName?: string | null;
  query: string;
  setQuery: (v: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}> = ({ titleCount, window, setWindow, friendName = null, query, setQuery, searchInputRef }) => (
  <div
    style={{
      margin: '0 16px 20px',
      borderRadius: 16,
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: FONT,
    }}
  >

    {/* Top half: title + count + toggle */}
    <div style={{ position: 'relative', zIndex: 1, padding: '18px 18px 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '0.16em',
          marginBottom: 8,
        }}
      >
        <Crown size={11} strokeWidth={2.4} />
        COURSE CHAMPIONS
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
        }}
      >
        {titleCount === 0
          ? (friendName ? `${friendName}'s reign starts here` : 'Your reign starts here')
          : (friendName
              ? `${friendName} holds ${titleCount} title${titleCount === 1 ? '' : 's'}`
              : `You hold ${titleCount} title${titleCount === 1 ? '' : 's'}`)}
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
          ? (friendName
              ? `${friendName} needs to top a leaderboard at any course to earn their first title`
              : 'Top the leaderboard at any course to earn your first title')
          : window === '90d'
            ? 'across rolling 90-day leaderboards'
            : 'across all-time course records'}
      </div>

      <WindowToggle window={window} setWindow={setWindow} />
    </div>

    {/* Hairline divider */}
    <div
      aria-hidden
      style={{
        height: 1,
        background: 'rgba(255,255,255,0.07)',
        margin: '0 18px',
      }}
    />

    {/* Bottom half: prompt + search field */}
    <div style={{ position: 'relative', zIndex: 1, padding: '16px 18px 18px' }}>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          marginBottom: 10,
          letterSpacing: '-0.005em',
        }}
      >
        Search any course to see its champions.
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12,
          padding: '12px 14px',
        }}
      >
        <Search size={16} color={GOLD} />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "Augusta" or "Royal Birkdale"…'
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT,
            fontSize: 13,
            color: 'var(--hcp-t-100)',
          }}
        />
      </div>
    </div>
  </div>
);

export const CourseLegendsSection: React.FC<Props> = ({
  userId,
  onSelectCourse,
  friendName,
}) => {
  const [query, setQuery] = useState('');
  const [window, setWindow] = useState<LegendWindow>('all_time');
  const playedQuery = useUserPlayedCourses(userId);
  const homeClubQuery = useUserHomeClubCourses(userId);
  const discoverQuery = useDiscoverCoursesThisWeek();
  const searchQuery = useCourseSearch(query);
  const { data: titleCount = 0 } = useUserLegendTitleCount(userId, window);

  const played = playedQuery.data ?? [];
  const homeClubCourses = homeClubQuery.data ?? [];
  const discover = discoverQuery.data ?? [];
  const showSearchResults = query.trim().length >= 2;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearchResults) return;
    const id = requestAnimationFrame(() => {
      searchWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [showSearchResults]);

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
    <section style={{ marginTop: 32 }}>
      <div ref={searchWrapperRef} style={{ scrollMarginTop: 12 }}>
        <SectionHero
          titleCount={titleCount}
          window={window}
          setWindow={setWindow}
          friendName={friendName}
          query={query}
          setQuery={setQuery}
          searchInputRef={searchInputRef}
        />
      </div>

      {showSearchResults ? (
        <SearchResultsSubsection
          query={query}
          results={searchQuery.data ?? []}
          isLoading={searchQuery.isLoading}
          isError={searchQuery.isError}
          onRetry={() => searchQuery.refetch()}
          onSelectCourse={onSelectCourse}
        />
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
    </section>
  );
};

export default CourseLegendsSection;
