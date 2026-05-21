import React, { useMemo, useState } from 'react';
import { useUserPlayedCourses } from '@/hooks/gam/useUserPlayedCourses';
import { useUserHomeClubCourses } from '@/hooks/gam/useUserHomeClubCourses';
import { useDiscoverCoursesThisWeek } from '@/hooks/gam/useDiscoverCoursesThisWeek';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import {
  useCourseLegendHolders,
  type CourseLegendHolderRow,
} from '@/hooks/gam/useCourseLegendHolders';
import type { LegendCategory } from '@/lib/gam/types';
import CourseSearch from './_shared/CourseSearch';
import HomeClubSubsection from './subsections/HomeClubSubsection';
import YourCoursesSubsection from './subsections/YourCoursesSubsection';
import DiscoverSubsection from './subsections/DiscoverSubsection';
import SearchResultsSubsection from './subsections/SearchResultsSubsection';
import type { CourseSelection } from './types';

interface Props {
  userId: string;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const CourseLegendsSection: React.FC<Props> = ({
  userId,
  onSelectCourse,
  friendName,
}) => {
  const [query, setQuery] = useState('');
  const playedQuery = useUserPlayedCourses(userId);
  const homeClubQuery = useUserHomeClubCourses(userId);
  const discoverQuery = useDiscoverCoursesThisWeek();
  const searchQuery = useCourseSearch(query);

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

  const holdersByCourse = useMemo(() => {
    const map = new Map<string, Map<LegendCategory, CourseLegendHolderRow>>();
    (holderRows ?? []).forEach((row) => {
      let inner = map.get(row.course_id);
      if (!inner) {
        inner = new Map();
        map.set(row.course_id, inner);
      }
      inner.set(row.category, row);
    });
    return map;
  }, [holderRows]);

  return (
    <div>
      <CourseSearch value={query} onChange={setQuery} />

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
    </div>
  );
};

export default CourseLegendsSection;
