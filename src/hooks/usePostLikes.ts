import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { reactionActorOf } from '@/lib/reactionActor';

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
 * WHO LIKED IT. 'round' keys on the WHS score id, 'review' on the review id:
 * the two content_reactions subjects, read identically. The 'post' source
 * resolves a ROUND post (posts.whs_score_id) or a REVIEW post
 * (posts.source_review_id) to that same subject and reads content_reactions
 * ALONE; a plain photo/video post reads post_likes, where its likes live and
 * always will.
 *
 * WHY ONE STORE (8 Oct 2026): content_reactions gained actor_type/actor_id
 * (unique on target + actor) on 8 Oct 2026. Before that it could only hold a
 * personal like, so business likes on round and review posts had to live in
 * post_likes, and this hook stitched the two stores together. On that date the
 * stranded post_likes rows on round/review posts were moved into
 * content_reactions and toggle_post_like began routing EVERY actor there, so
 * post_likes holds no rows on those posts and cannot gain one. Reading
 * content_reactions alone is therefore complete: it did not drop business
 * likers, it is the first read that sees all of them in one place.
 *
 * IDENTITY: every liker's identity comes from its actor (reactionActorOf) —
 * a business row lists as the business (business_accounts), a personal row as
 * the member. user_id is the human who tapped and is never used to name a
 * liker; it is read only as the legacy rule for null-actor rows, which are
 * personal by definition. This hook decides no "mine" state.
 *
 * Mirror of public.viewer_liked_post — keep the routing in step with it.
 */
type Actor = { type: 'personal' | 'business'; id: string; userId: string };

export type LikeSource = 'post' | 'editorial' | 'review' | 'round';

async function readReactions(targetType: 'round' | 'review', targetId: string): Promise<RawLike[]> {
  const { data, error } = await supabase
    .from('content_reactions')
    .select('user_id, actor_type, actor_id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as RawLike[];
}

export function usePostLikes(postId: string | null, enabled: boolean, source: LikeSource = 'post') {
  return useQuery({
    queryKey: ['post-likes', postId, source],
    enabled: !!postId && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!postId) return [] as PostLiker[];
      let likes: RawLike[] = [];

      if (source === 'editorial') {
        // Editorial card likes have no actor columns — all personal.
        const { data, error: likesError } = await supabase
          .from('editorial_card_likes')
          .select('user_id')
          .eq('card_id', postId)
          .order('created_at', { ascending: false })
          .limit(200);
        if (likesError) throw likesError;
        likes = (data ?? []).map(l => ({ user_id: l.user_id }));
      } else if (source === 'review' || source === 'round') {
        likes = await readReactions(source, postId);
      } else {
        const { data: post } = await supabase
          .from('posts')
          .select('whs_score_id, source_review_id')
          .eq('id', postId)
          .maybeSingle();

        if (post?.whs_score_id) {
          likes = await readReactions('round', post.whs_score_id);
        } else if (post?.source_review_id) {
          likes = await readReactions('review', post.source_review_id);
        } else {
          const { data, error: likesError } = await supabase
            .from('post_likes')
            .select('user_id, actor_type, actor_id')
            .eq('post_id', postId)
            .order('created_at', { ascending: false })
            .limit(200);
          if (likesError) throw likesError;
          likes = (data ?? []) as RawLike[];
        }
      }
      if (likes.length === 0) return [] as PostLiker[];

      // One resolution: each row -> its actor, deduped on (type, id).
      const seen = new Set<string>();
      const actors: Actor[] = [];
      for (const like of likes) {
        const a = reactionActorOf(like);
        const key = `${a.type}:${a.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        actors.push({ ...a, userId: like.user_id });
      }

      const personalIds = actors.filter(a => a.type === 'personal').map(a => a.id);
      const businessIds = actors.filter(a => a.type === 'business').map(a => a.id);

      // Step 2: fetch profiles for personal actors
      const { data: profiles, error: profilesError } = personalIds.length > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', personalIds)
        : { data: [] as any[], error: null };

      if (profilesError) throw profilesError;

      // Step 3: fetch business accounts for business actors
      const { data: businesses, error: businessesError } = businessIds.length > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, slug, logo_url')
            .in('id', businessIds)
            .eq('is_deleted', false)
        : { data: [] as any[], error: null };

      if (businessesError) throw businessesError;

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      const businessMap = new Map((businesses ?? []).map(b => [b.id, b]));

      // Return in original like order (deduped). Identity from the actor only.
      return actors.map(({ type, id, userId }) => {
        if (type === 'business') {
          const b = businessMap.get(id);
          return {
            userId,
            displayName: b?.name ?? 'Business',
            username: b?.slug ?? '',
            avatarUrl: b?.logo_url ?? null,
            actorType: 'business' as const,
            actorId: id,
          } as PostLiker;
        }
        const profile = profileMap.get(id);
        return {
          userId,
          displayName: profile?.display_name ?? 'Golfer',
          username: profile?.username ?? '',
          avatarUrl: profile?.profile_photo_url ?? null,
          actorType: 'personal' as const,
          actorId: id,
        } as PostLiker;
      });
    },
  });
}
