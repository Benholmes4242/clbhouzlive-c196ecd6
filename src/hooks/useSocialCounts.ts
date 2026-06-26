import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SocialCountsActorType = 'personal' | 'business';

export interface SocialCounts {
  followers: number;
  following: number;
  friends: number;
}

/**
 * Per-actor social counts (Phase 2b).
 *
 * Reads the unified `follows` table via `get_actor_social_counts` so the
 * numbers reflect the profile being viewed — a business profile shows the
 * business's followers/following independent of any manager's personal counts.
 *
 * Backwards compatible: passing a string (userId) is treated as a personal
 * actor so existing callers keep working until they migrate.
 */
export function useSocialCounts(
  actorOrUserId: string | { type: SocialCountsActorType; id: string } | undefined,
) {
  const actor =
    typeof actorOrUserId === 'string'
      ? { type: 'personal' as SocialCountsActorType, id: actorOrUserId }
      : actorOrUserId;

  const actorType = actor?.type;
  const actorId = actor?.id;

  return useQuery({
    queryKey: ['social-counts', actorType, actorId],
    enabled: !!actorType && !!actorId,
    queryFn: async (): Promise<SocialCounts> => {
      if (!actorType || !actorId) {
        return { followers: 0, following: 0, friends: 0 };
      }

      const { data, error } = await supabase.rpc('get_actor_social_counts', {
        p_actor_type: actorType,
        p_actor_id: actorId,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      return {
        followers: row?.followers ?? 0,
        following: row?.following ?? 0,
        friends: row?.friends ?? 0,
      };
    },
    staleTime: 30_000,
  });
}
