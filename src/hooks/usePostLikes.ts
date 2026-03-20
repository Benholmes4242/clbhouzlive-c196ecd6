import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostLiker {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export function usePostLikes(postId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['post-likes', postId],
    enabled: !!postId && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      // Step 1: get user_ids from post_likes
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', postId!)
        .order('created_at', { ascending: false })
        .limit(200);

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [] as PostLiker[];

      const userIds = [...new Set(likes.map(l => l.user_id))];

      // Step 2: fetch profiles for those user_ids
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles ?? []).map(p => [p.id, p])
      );

      // Return in original like order
      return userIds.map(uid => {
        const profile = profileMap.get(uid);
        return {
          userId: uid,
          displayName: profile?.display_name ?? 'Golfer',
          username: profile?.username ?? '',
          avatarUrl: profile?.avatar_url ?? null,
        } as PostLiker;
      });
    },
  });
}
