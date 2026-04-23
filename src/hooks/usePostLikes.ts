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

export function usePostLikes(postId: string | null, enabled: boolean, source: 'post' | 'editorial' = 'post') {
  return useQuery({
    queryKey: ['post-likes', postId, source],
    enabled: !!postId && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      let likes: RawLike[] = [];

      if (source === 'editorial') {
        // Editorial card likes have no actor columns — treat all as personal.
        const { data, error: likesError } = await supabase
          .from('editorial_card_likes')
          .select('user_id')
          .eq('card_id', postId!)
          .order('created_at', { ascending: false })
          .limit(200);

        if (likesError) throw likesError;
        if (!data || data.length === 0) return [] as PostLiker[];
        likes = data.map(l => ({ user_id: l.user_id }));
      } else {
        // Post likes — include actor info so business likers route correctly.
        const { data, error: likesError } = await supabase
          .from('post_likes')
          .select('user_id, actor_type, actor_id')
          .eq('post_id', postId!)
          .order('created_at', { ascending: false })
          .limit(200);

        if (likesError) throw likesError;
        if (!data || data.length === 0) return [] as PostLiker[];
        likes = data as RawLike[];
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
