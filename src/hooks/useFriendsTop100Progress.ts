import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendTop100Progress {
  user_id: string;
  courses_played_in_list: number;
  profile: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
}

export function useFriendsTop100Progress(userId: string | undefined, listId: string | undefined) {
  return useQuery({
    queryKey: ['friends-top100-progress', userId, listId],
    enabled: !!userId && !!listId,
    queryFn: async () => {
      if (!userId || !listId) return [];

      // Get friend IDs
      const { data: relationships, error: relError } = await supabase
        .from('user_relationships' as any)
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'following');

      if (relError) throw relError;
      const friendIds = (relationships || []).map((r: any) => r.following_id);
      if (friendIds.length === 0) return [];

      // Get courses for this Top 100 list
      const { data: memberships, error: memError } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .eq('list_id', listId);

      if (memError) throw memError;
      const courseIds = (memberships || []).map((m: any) => m.course_id);
      if (courseIds.length === 0) return [];

      // Get friend activity for these courses
      const { data: activity, error: actError } = await supabase
        .from('user_course_activity' as any)
        .select('user_id, course_id')
        .in('user_id', friendIds)
        .in('course_id', courseIds);

      if (actError) throw actError;

      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', friendIds);

      if (profileError) throw profileError;

      // Aggregate by user
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const map = new Map<string, FriendTop100Progress>();
      
      for (const row of (activity || []) as any[]) {
        const existing = map.get(row.user_id);
        const profile = profileMap.get(row.user_id);
        
        if (!profile) continue;
        
        if (!existing) {
          map.set(row.user_id, {
            user_id: row.user_id,
            courses_played_in_list: 1,
            profile,
          });
        } else {
          existing.courses_played_in_list += 1;
        }
      }

      return Array.from(map.values()).sort(
        (a, b) => b.courses_played_in_list - a.courses_played_in_list
      );
    },
    staleTime: 60_000,
  });
}
