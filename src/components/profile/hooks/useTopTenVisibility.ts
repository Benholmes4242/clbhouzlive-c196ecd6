/**
 * useTopTenVisibility — BRIEF_TOP_TEN_VISIBILITY §4, amended by
 * BRIEF_TOP_TEN_VISIBILITY_ROUNDTRIP.
 *
 * Resolves top_ten_visibility for a profile against the viewer's relationship
 * to the owner, and returns whether the Top 10 section may render.
 *
 * THE VALUE IS PASSED IN, NEVER FETCHED. ProfilePageV2 already holds the whole
 * user_profiles row (useUserProfile selects '*'), so the setting is resolved
 * before this section mounts; querying it again was a round-trip for a value in
 * memory, and worse, it made a PUBLIC profile — the overwhelming majority —
 * wait on a query before its section could paint.
 *
 * UNRESOLVED IS NOT ABSENT: owner / 'public' / 'private' / signed-out are all
 * answered with NO query at all, and isLoading is false in every one of those
 * cases. Only 'friends' and 'followers' with a signed-in non-owner viewer reach
 * the relationship query, from the same two tables the rest of the app uses:
 *   - user_friends (accepted)  — src/hooks/useFriendship.ts:41-62
 *   - user_follows             — src/hooks/messaging/usePlayedWith.ts:43
 *
 * The home club gate (useProfileClubs.ts:136) is a binary owner-or-public check
 * and is deliberately NOT reused or extended here; that is a separate decision.
 *
 * DISPLAY GATE ONLY. Nothing here filters data, and useUserTopTenCourses is
 * untouched: the rows remain readable by any signed-in member.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TopTenVisibility = 'public' | 'followers' | 'friends' | 'private';

interface Result {
  /** May the section render for this viewer? Owner is always true. */
  canView: boolean;
  /** The owner's current setting (defaults to 'public' when the column is null). */
  visibility: TopTenVisibility;
  isLoading: boolean;
}

const coerce = (v: unknown): TopTenVisibility =>
  v === 'followers' || v === 'friends' || v === 'private' ? v : 'public';

export function useTopTenVisibility(
  ownerId: string | undefined,
  viewerId: string | undefined,
  /** Raw user_profiles.top_ten_visibility, straight off the profile row. */
  visibilityValue: string | null | undefined,
): Result {
  const isOwner = !!ownerId && ownerId === viewerId;
  const visibility = coerce(visibilityValue);

  /* Every case that can be answered from memory is answered from memory. */
  const decidedWithoutQuery =
    isOwner ||
    visibility === 'public' ||
    visibility === 'private' ||
    !viewerId ||
    !ownerId;

  const decidedAnswer = isOwner || visibility === 'public';

  const { data, isLoading } = useQuery({
    queryKey: ['top-ten-visibility', 'relationship', ownerId, viewerId, visibility],
    enabled: !decidedWithoutQuery,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      // 'friends' and 'followers' both need an accepted friendship first.
      const { data: friendship } = await supabase
        .from('user_friends')
        .select('id')
        .or(
          `and(user_id.eq.${viewerId},friend_id.eq.${ownerId}),and(user_id.eq.${ownerId},friend_id.eq.${viewerId})`,
        )
        .eq('status', 'accepted')
        .maybeSingle();

      if (friendship) return true;
      if (visibility === 'friends') return false;

      // 'followers' — friends OR a follower of the owner.
      const { data: follow } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', viewerId!)
        .eq('following_id', ownerId!)
        .maybeSingle();

      return !!follow;
    },
  });

  if (decidedWithoutQuery) {
    return { canView: decidedAnswer, visibility, isLoading: false };
  }

  return { canView: data ?? false, visibility, isLoading };
}
