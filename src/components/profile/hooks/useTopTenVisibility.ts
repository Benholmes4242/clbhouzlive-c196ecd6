/**
 * useTopTenVisibility — BRIEF_TOP_TEN_VISIBILITY §4.
 *
 * Resolves user_profiles.top_ten_visibility for a profile against the viewer's
 * relationship to the owner, and returns whether the Top 10 section may render.
 *
 * WHY THIS HOOK EXISTS RATHER THAN A REUSED ONE:
 * The home club gate (useProfileClubs.ts:135-137) is BINARY — it reads
 * home_club_visibility and then allows `isOwner || visibility === 'public'`.
 * It never resolves 'followers' or 'friends' on the client; those two values
 * fall through to hidden there. Since the four-value control is the contract
 * for this section, the relationship test that home club lacks is resolved
 * here, from the same two tables the rest of the app uses:
 *   - user_friends (accepted)  — src/hooks/useFriendship.ts:41-62
 *   - user_follows             — src/hooks/messaging/usePlayedWith.ts:43
 *
 * DISPLAY GATE ONLY. Nothing here filters data, and useUserTopTenCourses is
 * untouched: the rows remain readable by any signed-in member (see report).
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
): Result {
  const isOwner = !!ownerId && ownerId === viewerId;

  const { data, isLoading } = useQuery({
    queryKey: ['top-ten-visibility', ownerId, viewerId],
    enabled: !!ownerId,
    staleTime: 60_000,
    queryFn: async (): Promise<{ canView: boolean; visibility: TopTenVisibility }> => {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('top_ten_visibility')
        .eq('id', ownerId!)
        .maybeSingle();

      if (error) console.error('[useTopTenVisibility] profile query error:', error);

      const visibility = coerce((profile as { top_ten_visibility?: string } | null)?.top_ten_visibility);

      // The owner always sees their own section, whatever the setting.
      if (isOwner) return { canView: true, visibility };
      if (visibility === 'public') return { canView: true, visibility };
      if (!viewerId || visibility === 'private') return { canView: false, visibility };

      // 'friends' and 'followers' both need an accepted friendship first.
      const { data: friendship } = await supabase
        .from('user_friends')
        .select('id')
        .or(
          `and(user_id.eq.${viewerId},friend_id.eq.${ownerId}),and(user_id.eq.${ownerId},friend_id.eq.${viewerId})`,
        )
        .eq('status', 'accepted')
        .maybeSingle();

      if (friendship) return { canView: true, visibility };
      if (visibility === 'friends') return { canView: false, visibility };

      // 'followers' — friends OR a follower of the owner.
      const { data: follow } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', viewerId)
        .eq('following_id', ownerId!)
        .maybeSingle();

      return { canView: !!follow, visibility };
    },
  });

  return {
    canView: isOwner ? true : (data?.canView ?? false),
    visibility: data?.visibility ?? 'public',
    isLoading,
  };
}
