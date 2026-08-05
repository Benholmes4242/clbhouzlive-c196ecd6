import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useFriendIdSet — the viewer's accepted friendships, ids only.
 *
 * Around the world names an actor ONLY when the event is the viewer's own or
 * the actor is a friend (BRIEF, section 2 privacy rule); everyone else reads
 * "a member" because the course, not the person, is the story.
 */
export function useFriendIdSet(userId: string | undefined) {
  return useQuery({
    queryKey: ['courseled', 'friend-ids', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');
      const out = new Set<string>();
      for (const f of (data ?? []) as Array<{ user_id: string; friend_id: string }>) {
        out.add(f.user_id === userId ? f.friend_id : f.user_id);
      }
      return out;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
