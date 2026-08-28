import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';

/**
 * Activity V2 feed row. Mirrors the RETURNS TABLE columns of the
 * public.get_activity_feed RPC exactly.
 */
export interface ActivityFeedRowV2 {
  notif_id: string;
  notif_type: string;
  created_at: string;
  is_read: boolean;
  message: string | null;
  title: string | null;
  entity_id: string | null;
  entity_type: string | null;
  data: Record<string, unknown> | null;
  actor_user_id: string | null;
  actor_username: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  /** 'business' when the notification's source post was authored as a business.
   *  actor_user_id stays the PERSON — blocking, mute-by-user and the friends
   *  filter all key on it. These two are for NAVIGATION only. */
  actor_kind: 'business' | 'personal' | null;
  actor_route_id: string | null;
  liker_avatar_urls: unknown;
  target_course_name: string | null;
  target_course_image: string | null;
  target_poster_url: string | null;
  target_review_rating: number | null;
}

// Minimal structural rpc caller — the generated Supabase types do not
// include this RPC signature, but the call shape and error shape are stable.
type RpcResult<T> = { data: T | null; error: { message: string } | null };
const rpcActivityFeed = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args: Record<string, unknown>,
) => Promise<RpcResult<ActivityFeedRowV2[]>>;

export type ActivityFilterV2 = null | 'new' | 'mentions' | 'friends' | 'crowns';

const PAGE_SIZE = 30;

export function useActivityFeedV2(filter: ActivityFilterV2) {
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();

  const userId = user?.id ?? null;
  const actorType: 'business' | 'personal' =
    activeActor?.type === 'business' ? 'business' : 'personal';
  const actorId = activeActor?.id ?? userId ?? null;

  return useInfiniteQuery({
    queryKey: ['activity-v2', actorType, actorId, filter],
    enabled: !!userId && !!actorId,
    staleTime: 60_000,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const args: Record<string, unknown> = {
        p_user_id: userId,
        p_actor_type: actorType,
        p_actor_id: actorId,
        p_filter: filter,
        p_page_size: PAGE_SIZE,
        p_cursor: pageParam ?? null,
      };
      const { data, error } = await rpcActivityFeed('get_activity_feed', args);
      if (error) throw error;
      return (data ?? []) as ActivityFeedRowV2[];
    },
    getNextPageParam: (last) => {
      if (!last || last.length < PAGE_SIZE) return undefined;
      return last[last.length - 1]?.created_at ?? undefined;
    },
  });
}
