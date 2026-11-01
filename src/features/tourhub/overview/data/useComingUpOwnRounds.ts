/** One member-scoped section read. gam_round_stats.course_id is golf_courses.id
 * (verified by the played-suggestions join). Errors suppress dependent figures;
 * guest sessions and unresolved identity never issue a round read. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isGuestUser } from '@/features/guest/useIsGuest';
import { ownCourseFigures } from '../sections/comingUpRules';

export async function loadComingUpOwnRounds(userId: string | null, guest: boolean, courseIds: string[]) {
  const ids = [...new Set(courseIds)].sort();
  if (!userId || guest || !ids.length) return new Map();
  const { data, error } = await supabase.from('gam_round_stats').select('course_id, gross_score, holes_played').eq('user_id', userId).in('course_id', ids);
  if (error) throw error;
  return ownCourseFigures(data ?? []);
}
export function useComingUpOwnRounds(courseIds: string[]) {
  const { user } = useSupabaseSession();
  const guest = isGuestUser(user);
  const ids = [...new Set(courseIds)].sort();
  const query = useQuery({ queryKey: ['coming-up-own-rounds', user?.id, guest, ids], enabled: !!user && !guest && ids.length > 0, queryFn: () => loadComingUpOwnRounds(user?.id ?? null, guest, ids), staleTime: 60_000 });
  return user && !guest && !query.isError ? query.data : undefined;
}