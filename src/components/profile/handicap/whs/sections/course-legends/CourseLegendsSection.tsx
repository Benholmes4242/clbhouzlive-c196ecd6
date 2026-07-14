import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
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
const AMBER = '#F7931E';

interface Props {
  userId: string;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export type WindowToggleVariant = 'dark' | 'light';

export const WindowToggle: React.FC<{
  window: LegendWindow;
  setWindow: (w: LegendWindow) => void;
  variant?: WindowToggleVariant;
}> = ({ window, setWindow, variant = 'dark' }) => {
  const isLight = variant === 'light';
  return (
    <div
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        gap: 6,
      }}
    >
      {([
        { v: 'all_time', label: 'ALL TIME' },
        { v: '90d', label: '90D' },
      ] as const).map((o) => {
        const active = window === o.v;
        const background = active
          ? isLight
            ? '#15171F'
            : 'rgba(255,255,255,0.92)'
          : 'transparent';
        const color = active
          ? isLight
            ? '#FFFFFF'
            : '#0F172A'
          : isLight
            ? 'rgba(15,23,42,0.65)'
            : 'rgba(255,255,255,0.75)';
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => setWindow(o.v)}
            style={{
              padding: '6px 13px',
              borderRadius: 999,
              background,
              color,
              border: 'none',
              fontFamily: FONT,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};


const SectionHero: React.FC<{
  titleCount: number;
  window: LegendWindow;
  setWindow: (w: LegendWindow) => void;
  friendName?: string | null;
}> = ({ titleCount, window, setWindow, friendName = null }) => {
  const owner = friendName ?? 'You';
  const verb = friendName ? 'holds' : 'hold';
  const isZero = titleCount === 0;

  return (
    <div
      style={{
        margin: '0 16px',
        borderRadius: 18,
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        padding: '16px',
        fontFamily: FONT,
      }}
    >
      {/* Row 1: eyebrow */}
      <div style={{
        fontSize: 8.5, fontWeight: 800, letterSpacing: '0.12em',
        color: 'var(--hcp-t-60)', textTransform: 'uppercase',
      }}>
        COURSE CHAMPIONS
      </div>

      {/* Row 2: headline + toggle */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 12, marginTop: 8,
      }}>
        <div style={{
          fontSize: 24, fontWeight: 800, color: 'var(--hcp-t-100)',
          letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          {isZero ? (
            friendName ? `${friendName}'s reign starts here` : 'Your reign starts here'
          ) : (
            <>
              {owner} {verb}{' '}
              <span style={{
                color: AMBER,
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {titleCount}
              </span>
              {' '}title{titleCount === 1 ? '' : 's'}
            </>
          )}
        </div>
        <WindowToggle window={window} setWindow={setWindow} />
      </div>

      {/* Row 3: sub-line */}
      <div style={{
        fontSize: 12, color: 'var(--hcp-t-40)', marginTop: 6,
      }}>
        {isZero
          ? (friendName
              ? `${friendName} needs to top a leaderboard at any course to earn their first title`
              : 'Top the leaderboard at any course to earn your first title')
          : window === '90d'
            ? 'across the last 90 days'
            : 'across all-time course records'}
      </div>
    </div>
  );
};

const SearchRow: React.FC<{
  open: boolean;
  query: string;
  setQuery: (v: string) => void;
  onOpen: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}> = ({ open, query, setQuery, onOpen, inputRef }) => (
  <div style={{ margin: '0 16px', padding: '12px 4px 0' }}>
    {open ? (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--hcp-bg-2)',
        border: '1px solid var(--hcp-line-2)',
        borderRadius: 12, padding: '12px 14px',
      }}>
        <Search size={16} color="var(--hcp-t-60)" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "Augusta" or "Royal Birkdale"…'
          style={{
            flex: 1, minWidth: 0, background: 'transparent',
            border: 'none', outline: 'none', fontFamily: FONT,
            fontSize: 13, color: 'var(--hcp-t-100)',
          }}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={onOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Search size={16} color="var(--hcp-t-60)" />
        <span style={{
          flex: 1, fontSize: 15, fontWeight: 800, color: 'var(--hcp-t-100)',
          letterSpacing: '-0.01em',
        }}>
          Find any course's champions
        </span>
        <ArrowRight size={16} color="var(--hcp-t-100)" />
      </button>
    )}
  </div>
);



export const CourseLegendsSection: React.FC<Props> = ({
  userId,
  onSelectCourse,
  friendName,
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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

  const openSearch = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  return (
    <section style={{ marginTop: 32 }}>
      <div ref={searchWrapperRef} style={{ scrollMarginTop: 12 }}>
        <SectionHero
          titleCount={titleCount}
          window={window}
          setWindow={setWindow}
          friendName={friendName}
        />
        <SearchRow
          open={searchOpen || showSearchResults}
          query={query}
          setQuery={setQuery}
          onOpen={openSearch}
          inputRef={searchInputRef}
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
