import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendRecentActivity {
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: string;
  played_at: string;
  friend_id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  rating: number | null;
}

export function useTop100FriendRecentActivity(scope: string, timeRange: string) {
  return useQuery({
    queryKey: ['top100-friend-recent-activity', scope, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top100_friend_recent_activity', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: 30,
      });

      if (error) throw error;
      return (data ?? []) as FriendRecentActivity[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
