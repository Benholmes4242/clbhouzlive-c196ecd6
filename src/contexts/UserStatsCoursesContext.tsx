import React, { createContext, useContext, useMemo } from 'react';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

/**
 * Phase E: single subscription to the Phase B hook, exposed as a
 * memoised Map<course_id, rounds_count>. Cards/search rows consume
 * via useUserStatsCourseMap() — never call useUserAnalyticsCourses
 * from a card render path (virtualised lists would re-subscribe per
 * card and defeat the whole point).
 *
 * Signed out / no data / loading / error => empty map.
 * NOTHING renders in that state so cards stay byte-identical.
 */
const UserStatsCoursesContext = createContext<Map<string, number>>(new Map());

export const UserStatsCoursesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseSession();
  const { data } = useUserAnalyticsCourses({ enabled: !!user?.id });

  const map = useMemo(() => {
    const m = new Map<string, number>();
    if (!data) return m;
    for (const row of data) {
      if (row?.course_id && row.rounds_count > 0) {
        m.set(row.course_id, row.rounds_count);
      }
    }
    return m;
  }, [data]);

  return (
    <UserStatsCoursesContext.Provider value={map}>
      {children}
    </UserStatsCoursesContext.Provider>
  );
};

export function useUserStatsCourseMap(): Map<string, number> {
  return useContext(UserStatsCoursesContext);
}

export function useUserStatsRoundsForCourse(courseId: string | null | undefined): number | null {
  const map = useUserStatsCourseMap();
  if (!courseId) return null;
  const n = map.get(courseId);
  return n && n > 0 ? n : null;
}
