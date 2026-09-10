import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SocialCountsActorType = 'personal' | 'business';

/**
 * BRIEF_PROFILE_PASS_ONE §A — A COUNT IS `null` WHEN IT IS NOT KNOWN.
 *
 * These were `number` and the hook coerced a missing row to 0, so a member
 * with 42 followers and a failed read drew identical pixels. A real zero is
 * still 0; an absent row is now `null` and the surface must render the label
 * with NO figure. The query itself throws on RPC error, so consumers get
 * `isError` for the failed-call case and `null` for the no-row case; neither
 * may be shown as a zero.
 */
export interface SocialCounts {
  followers: number | null;
  following: number | null;
  friends: number | null;
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
        return { followers: null, following: null, friends: null };
      }

      const { data, error } = await supabase.rpc('get_actor_social_counts', {
        p_actor_type: actorType,
        p_actor_id: actorId,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      // No row = nothing is known. Do NOT substitute 0 here.
      return {
        followers: row?.followers ?? null,
        following: row?.following ?? null,
        friends: row?.friends ?? null,
      };
    },
    staleTime: 30_000,
  });
}
