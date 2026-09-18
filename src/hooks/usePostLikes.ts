import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostLiker {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  /** Actor type for the like (only present for post likes; editorial likes are personal-only). */
  actorType?: 'personal' | 'business';
  /** Actor id — business id when actorType === 'business', otherwise equal to userId. */
  actorId?: string;
}

interface RawLike {
  user_id: string;
  actor_type?: 'personal' | 'business' | null;
  actor_id?: string | null;
}

/**
 * G7.3(a) — 'round' keys on the WHS SCORE ID, 'review' on the review id: the
 * two content_reactions subjects, read identically. A round no longer needs a
 * post to show who liked it.
 *
 * THE 'post' SOURCE HAS TWO BACKED CASES, and both take their PERSONAL hearts
 * from content_reactions rather than post_likes:
 *
 *   - posts.whs_score_id IS NOT NULL  — a ROUND post. Personal hearts live in
 *     content_reactions (target_type='round', target_id = whs_score_id).
 *   - posts.source_review_id IS NOT NULL — a REVIEW post. Personal hearts live
 *     in content_reactions (target_type='review', target_id = source_review_id).
 *     R1 (18 Sep 2026) migrated the 283 personal post_likes that had accumulated
 *     on review posts into content_reactions, so this branch is the whole story;
 *     the review branch DEDUPES BY user_id because a member who hearted in both
 *     Explore and Clubhouse before the migration must appear once.
 *
 * In both cases BUSINESS-actor likes stay in post_likes (content_reactions has
 * no actor columns) and are folded back in.
 *
 * Mirror of public.viewer_liked_post — keep both branches in step with it.
 */
export type LikeSource = 'post' | 'editorial' | 'review' | 'round';

export function usePostLikes(postId: string | null, enabled: boolean, source: LikeSource = 'post') {
  return useQuery({
    queryKey: ['post-likes', postId, source],
    enabled: !!postId && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!postId) return [] as PostLiker[];
      let likes: RawLike[] = [];

      if (source === 'editorial') {
        // Editorial card likes have no actor columns — treat all as personal.
        const { data, error: likesError } = await supabase
          .from('editorial_card_likes')
          .select('user_id')
          .eq('card_id', postId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (likesError) throw likesError;
        if (!data || data.length === 0) return [] as PostLiker[];
        likes = data.map(l => ({ user_id: l.user_id }));
      } else if (source === 'review' || source === 'round') {
        // content_reactions has no actor columns — always personal.
        //
        // KNOWN, PRE-EXISTING, ONE ROW (18 Sep 2026): business-actor likes on a
        // round live in post_likes against the backing POST, not here, so the
        // scorecard card cannot see them. Card count and card names agree with
        // each other because both read content_reactions on the round — but a
        // business like shows in the Clubhouse feed and nowhere on the card.
        // If a like count disagrees between the feed and the card, this is why.
        // The 'post' source's round branch below is what still reads those rows.
        const { data, error: likesError } = await supabase
          .from('content_reactions')
          .select('user_id')
          .eq('target_type', source)
          .eq('target_id', postId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (likesError) throw likesError;
        if (!data || data.length === 0) return [] as PostLiker[];
        likes = data.map((like) => ({ user_id: like.user_id }));
      } else {
        // Post likes — include actor info so business likers route correctly.
        const { data, error: likesError } = await supabase
          .from('post_likes')
          .select('user_id, actor_type, actor_id')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (likesError) throw likesError;
        likes = (data ?? []) as RawLike[];

        // Round-backed AND review-backed posts keep their personal hearts in
        // content_reactions (canonical). ONE lookup carries both keys.
        // Mirror of public.viewer_liked_post — keep in step.
        const { data: post } = await supabase
          .from('posts')
          .select('whs_score_id, source_review_id')
          .eq('id', postId)
          .maybeSingle();

        if (post?.whs_score_id) {
          const { data: reactions, error: reactionsError } = await supabase
            .from('content_reactions')
            .select('user_id')
            .eq('target_type', 'round')
            .eq('target_id', post.whs_score_id)
            .order('created_at', { ascending: false })
            .limit(200);

          if (reactionsError) throw reactionsError;

          // Round reactions have no actor columns — always personal.
          likes = [
            ...(reactions ?? []).map((r) => ({
              user_id: r.user_id,
              actor_type: 'personal' as const,
              actor_id: r.user_id,
            })),
            // Business likes on round posts still live in post_likes.
            ...likes.filter((l) => (l.actor_type ?? 'personal') === 'business'),
          ];
        } else if (post?.source_review_id) {
          // R1 — the review's hearts are canonical in content_reactions
          // (target_type='review'). Same shape as the round branch above, with
          // one difference: DEDUPE BY user_id, because a member who hearted the
          // review in Explore AND in Clubhouse before the R1 migration has a
          // row on both sides and must appear once.
          const { data: reactions, error: reactionsError } = await supabase
            .from('content_reactions')
            .select('user_id')
            .eq('target_type', 'review')
            .eq('target_id', post.source_review_id)
            .order('created_at', { ascending: false })
            .limit(200);

          if (reactionsError) throw reactionsError;

          const reactionUserIds = new Set((reactions ?? []).map((r) => r.user_id));

          likes = [
            ...(reactions ?? []).map((r) => ({
              user_id: r.user_id,
              actor_type: 'personal' as const,
              actor_id: r.user_id,
            })),
            // Business likes on review posts still live in post_likes.
            ...likes.filter((l) => (l.actor_type ?? 'personal') === 'business'),
            // Any personal post_likes row not yet migrated: kept so no like
            // ever disappears, deduped by user_id against the reactions above.
            ...likes.filter(
              (l) =>
                (l.actor_type ?? 'personal') !== 'business' &&
                !reactionUserIds.has(l.user_id),
            ),
          ];
        }


        if (likes.length === 0) return [] as PostLiker[];
      }

      // Dedupe by (actor_type, actor_id) when actor info present, otherwise by user_id.
      const seen = new Set<string>();
      const dedupedLikes: RawLike[] = [];
      for (const like of likes) {
        const actorType = (like.actor_type ?? 'personal') as 'personal' | 'business';
        const actorId = like.actor_id ?? like.user_id;
        const key = `${actorType}:${actorId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        dedupedLikes.push(like);
      }

      // Collect personal user ids (for user_profiles lookup) and business ids.
      const personalIds = new Set<string>();
      const businessIds = new Set<string>();
      for (const like of dedupedLikes) {
        const actorType = (like.actor_type ?? 'personal') as 'personal' | 'business';
        if (actorType === 'business') {
          businessIds.add(like.actor_id ?? like.user_id);
        } else {
          personalIds.add(like.actor_id ?? like.user_id);
        }
      }

      // Step 2: fetch profiles for personal actors
      const { data: profiles, error: profilesError } = personalIds.size > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', Array.from(personalIds))
        : { data: [] as any[], error: null };

      if (profilesError) throw profilesError;

      // Step 3: fetch business accounts for business actors
      const { data: businesses, error: businessesError } = businessIds.size > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, slug, logo_url')
            .in('id', Array.from(businessIds))
            .eq('is_deleted', false)
        : { data: [] as any[], error: null };

      if (businessesError) throw businessesError;

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      const businessMap = new Map((businesses ?? []).map(b => [b.id, b]));

      // Return in original like order (deduped)
      return dedupedLikes.map(like => {
        const actorType = (like.actor_type ?? 'personal') as 'personal' | 'business';
        const actorId = like.actor_id ?? like.user_id;

        if (actorType === 'business') {
          const b = businessMap.get(actorId);
          return {
            userId: like.user_id,
            displayName: b?.name ?? 'Business',
            username: b?.slug ?? '',
            avatarUrl: b?.logo_url ?? null,
            actorType: 'business' as const,
            actorId,
          } as PostLiker;
        }

        const profile = profileMap.get(actorId);
        return {
          userId: like.user_id,
          displayName: profile?.display_name ?? 'Golfer',
          username: profile?.username ?? '',
          avatarUrl: profile?.profile_photo_url ?? null,
          actorType: 'personal' as const,
          actorId,
        } as PostLiker;
      });
    },
  });
}
