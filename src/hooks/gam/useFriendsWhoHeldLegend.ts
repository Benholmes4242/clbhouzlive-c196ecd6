import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegendCategory } from '@/lib/gam/types';

export interface FriendWhoHeldLegend {
  friend_user_id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  rank: number;
  value: number;
  attained_at: string;
}

/**
 * Returns the viewer's clbhouz friends ranked on a given legend at a given course.
 * Backed by RPC `get_friends_who_held_legend` (already deployed, SECURITY DEFINER).
 * PostgREST serialises `numeric` as string — we coerce to number.
 */
export function useFriendsWhoHeldLegend(
  category: LegendCategory | undefined,
  courseId: string | undefined,
  viewerUserId: string | undefined,
  limit = 5,
) {
  return useQuery({
    queryKey: ['friends-held-legend', category, courseId, viewerUserId, limit],
    enabled: Boolean(category && courseId && viewerUserId),
    staleTime: 60_000,
    queryFn: async (): Promise<FriendWhoHeldLegend[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_friends_who_held_legend', {
        p_category: category,
        p_course_id: courseId,
        p_viewer_user_id: viewerUserId,
        p_limit: limit,
      });
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        friend_user_id: String(r.friend_user_id),
        friend_name: String(r.friend_name ?? 'Friend'),
        friend_avatar_url: (r.friend_avatar_url as string | null) ?? null,
        rank: Number(r.rank ?? 0),
        value: Number(r.value ?? 0),
        attained_at: String(r.attained_at ?? ''),
      }));
    },
  });
}
