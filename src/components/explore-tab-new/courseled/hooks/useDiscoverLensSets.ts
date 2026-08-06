import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useUserWantToPlay } from '@/hooks/useUserWantToPlay';
import { useUserJourneyCourses } from '@/hooks/useUserJourneyCourses';
import { usePlayedUnratedCourses } from '@/hooks/usePlayedUnratedCourses';

/**
 * useDiscoverLensSets — the three membership sets the RELEVANCE lenses need
 * (BRIEF_DISCOVER_RELEVANCE A2/B3), resolved ONCE for the whole visible set.
 *
 * PLAYED  = rated courses (useUserJourneyCourses -> course_ratings) UNION
 *           tracked-but-unrated rounds (usePlayedUnratedCourses ->
 *           get_played_unrated_courses). Same sources the profile Courses tab
 *           uses; both are existing hooks, no new query is written here.
 * TOP 100 = course_top100_memberships on ACTIVE published lists, filtered to
 *           the candidate course ids in a single request.
 * SHORTLIST = useUserWantToPlay (course_shortlists, list_key='want_to_play').
 *
 * PROXIMITY is deliberately absent: no member latitude/longitude exists on the
 * profile record, so the FOR YOU proximity term is silently omitted rather than
 * prompting for location.
 */
export interface DiscoverLensSets {
  played: Set<string>;
  top100: Set<string>;
  shortlist: Set<string>;
}

export function useDiscoverLensSets(
  userId: string | undefined,
  courseIds: string[],
): DiscoverLensSets {
  const { wantToPlay } = useUserWantToPlay(userId);
  const journey = useUserJourneyCourses(userId);
  const { courses: playedUnrated } = usePlayedUnratedCourses(userId);

  const idKey = useMemo(() => [...new Set(courseIds)].sort().join(','), [courseIds]);

  const { data: top100 } = useQuery({
    queryKey: ['discover-lens-top100', idKey],
    enabled: idKey.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Set<string>> => {
      const ids = idKey.split(',');
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(is_active)')
        .in('course_id', ids)
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.course_id as string));
    },
  });

  const played = useMemo(() => {
    const s = new Set<string>();
    for (const c of journey.data?.played ?? []) if (c.id) s.add(c.id);
    for (const c of playedUnrated) if (c.course_id) s.add(c.course_id);
    return s;
  }, [journey.data, playedUnrated]);

  const shortlist = useMemo(
    () => new Set(wantToPlay.map((c) => c.course_id)),
    [wantToPlay],
  );

  return {
    played,
    top100: top100 ?? new Set<string>(),
    shortlist,
  };
}
