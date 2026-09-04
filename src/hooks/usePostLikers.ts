/**
 * usePostLikers — the ordered, enriched likers list behind the "Liked by" row
 * and the Likes sheet.
 *
 * READ ONLY. This hook never touches a like write path.
 *
 * Data source is `usePostLikes` (already the canonical likers list: it reads
 * content_reactions for round-backed posts and folds in business-actor likes
 * from post_likes). This hook adds three things on top, and nothing else:
 *
 *   1. ORDERING — people the viewer follows first, then everyone else, each
 *      group most recent first. usePostLikes already returns most-recent-first,
 *      so a stable partition preserves recency inside each group.
 *   2. ENRICHMENT — handicap index for personal actors (WHS wins over manual,
 *      matching the rest of the app) and business type for business actors.
 *   3. ONE ORDER FOR BOTH SURFACES — the avatar row shows the first names of
 *      the first entries of this same array, so preview and sheet can never
 *      disagree.
 *
 * The COUNT shown to the member is always the surface's own like count, never
 * `likers.length`: excluded (deleted) members must not change the count.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostLikes, type PostLiker } from '@/hooks/usePostLikes';
import { useBlockedUserIds } from '@/hooks/useBlockedUserIds';

export interface PostLikerEnriched extends PostLiker {
  /** Handicap index for personal actors. Null for business actors and for
   *  members with no index — the row must not render an empty handicap line. */
  handicapIndex: number | null;
  /** Business type label for business actors (shown instead of a handicap). */
  businessType: string | null;
  isFollowing: boolean;
}

function firstName(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

/** First names, in list order — used by the avatar row's copy. */
export function likerFirstNames(likers: PostLikerEnriched[], take: number): string[] {
  return likers.slice(0, take).map((l) => firstName(l.displayName) || l.username || 'Golfer');
}

export function usePostLikers(
  postId: string | null,
  enabled: boolean,
  source: 'post' | 'editorial' = 'post',
) {
  const { user } = useSupabaseSession();
  const blockedIds = useBlockedUserIds(user?.id ?? null);
  const base = usePostLikes(postId, enabled, source);
  const likers = base.data ?? [];

  const personalIds = useMemo(
    () =>
      Array.from(
        new Set(
          likers
            .filter((l) => (l.actorType ?? 'personal') === 'personal')
            .map((l) => l.actorId ?? l.userId),
        ),
      ).sort(),
    [likers],
  );
  const businessIds = useMemo(
    () =>
      Array.from(
        new Set(
          likers
            .filter((l) => l.actorType === 'business')
            .map((l) => l.actorId ?? l.userId),
        ),
      ).sort(),
    [likers],
  );

  const enrichment = useQuery({
    queryKey: ['post-likers-meta', postId, source, user?.id ?? null, personalIds, businessIds],
    enabled: enabled && !!postId && (personalIds.length > 0 || businessIds.length > 0),
    staleTime: 60_000,
    queryFn: async () => {
      const [profilesRes, businessesRes, followsRes] = await Promise.all([
        personalIds.length > 0
          ? supabase
              .from('user_profiles')
              .select('id, eg_handicap_index, manual_handicap_index')
              .in('id', personalIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        businessIds.length > 0
          ? supabase
              .from('business_accounts')
              .select('id, business_type')
              .in('id', businessIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        user?.id && personalIds.length > 0
          ? supabase
              .from('user_follows')
              .select('following_id')
              .eq('follower_actor_type', 'personal')
              .eq('follower_actor_id', user.id)
              .in('following_id', personalIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);

      const hcp = new Map<string, number | null>();
      for (const p of (profilesRes.data ?? []) as any[]) {
        const value = p.eg_handicap_index ?? p.manual_handicap_index ?? null;
        hcp.set(p.id, value === null ? null : Number(value));
      }
      const types = new Map<string, string | null>();
      for (const b of (businessesRes.data ?? []) as any[]) {
        types.set(b.id, b.business_type ?? null);
      }
      const following = new Set<string>(
        ((followsRes.data ?? []) as any[]).map((f) => f.following_id),
      );

      return { hcp, types, following };
    },
  });

  const ordered = useMemo<PostLikerEnriched[]>(() => {
    const meta = enrichment.data;
    const enrichedList = likers
      // Blocked members are excluded from the LIST only. The count shown to the
      // member comes from the surface's own like count, so it does not move.
      .filter((l) => (l.actorType === 'business' ? true : !blockedIds.has(l.actorId ?? l.userId)))
      .map((l) => {
        const actorId = l.actorId ?? l.userId;
        const isBusiness = l.actorType === 'business';
        return {
          ...l,
          handicapIndex: isBusiness ? null : meta?.hcp.get(actorId) ?? null,
          businessType: isBusiness ? meta?.types.get(actorId) ?? null : null,
          isFollowing: !isBusiness && !!meta?.following.has(actorId),
        } as PostLikerEnriched;
      });


    // Stable partition: followed first, then everyone else. usePostLikes
    // already ordered most-recent-first, so recency survives inside groups.
    return [
      ...enrichedList.filter((l) => l.isFollowing),
      ...enrichedList.filter((l) => !l.isFollowing),
    ];
  }, [likers, enrichment.data, blockedIds]);

  return {
    likers: ordered,
    isLoading: base.isLoading,
    /** True until follow state is known — ordering is not final before then. */
    isOrderPending: base.isLoading || (enrichment.isLoading && enrichment.fetchStatus !== 'idle'),
  };
}
