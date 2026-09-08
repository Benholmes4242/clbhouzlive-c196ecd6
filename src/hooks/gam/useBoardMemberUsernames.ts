import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_CHAMPIONS_TAB_REBUILD — the row tap needs a destination.
 *
 * get_course_legends DOES join user_profiles (display_name, profile_photo_url,
 * home_club, champions_visibility) but its RETURNS TABLE does not carry the
 * username, and that signature is deployed and consumed elsewhere — widening it
 * is a schema change, not a UI change. Profiles route by username only
 * (/profile/:username), so the ids the board already holds are resolved here in
 * one keyed read of the same table the RPC joins.
 *
 * A member without a username resolves to null and their row is NOT tappable —
 * no cursor, no press state, no event. A tap that fires and goes nowhere is the
 * one outcome that must not exist.
 */
export function useBoardMemberUsernames(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean))).sort();
  return useQuery<Record<string, string | null>>({
    queryKey: ['board-member-usernames', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', ids);
      if (error) return {};
      const map: Record<string, string | null> = {};
      (data ?? []).forEach((r: { id: string; username: string | null }) => {
        map[r.id] = r.username ?? null;
      });
      return map;
    },
  });
}
