/** Brief 50 — ONE read of the signed-in member's played state
 * (get_my_played_courses(null)), keyed ['played-courses', userId]. Every
 * played surface reads this lookup; signed out it is empty with no request. */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isGuestUser } from '@/features/guest/useIsGuest';
import type { PlayedEntry } from './playedRules';

export const playedCoursesKey = (userId: string | undefined) => ['played-courses', userId ?? 'anon'] as const;

export function usePlayedMemberId(): string | undefined {
  const { user } = useSupabaseSession();
  return user && !isGuestUser(user) ? user.id : undefined;
}

export function usePlayedCourses() {
  const userId = usePlayedMemberId();
  const query = useQuery<PlayedEntry[]>({
    queryKey: playedCoursesKey(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_played_courses', {} as never);
      if (error) throw error;
      return (data ?? []) as PlayedEntry[];
    },
  });
  const byId = useMemo(() => {
    const map = new Map<string, PlayedEntry>();
    for (const row of query.data ?? []) map.set(row.course_id, row);
    return map;
  }, [query.data]);
  return {
    userId,
    entries: query.data ?? [],
    byId,
    get: (courseId: string | undefined | null) => (courseId ? byId.get(courseId) : undefined),
    isLoading: Boolean(userId) && query.isLoading,
    isSuccess: query.isSuccess,
  };
}
