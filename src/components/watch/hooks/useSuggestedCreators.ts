import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuggestedCreator {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  handicap: number | null;
  homeCourse: string | null;
  totalEngagement: number;
  videoCount: number;
  isFollowed: boolean;
}

export function useSuggestedCreators(userId: string | undefined) {
  return useQuery({
    queryKey: ['suggested-creators', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase.rpc('get_suggested_creators', {
        p_user_id: userId,
        p_limit: 12,
      } as any);

      if (error) {
        console.error('[SuggestedCreators] RPC error:', error);
        return [];
      }

      return (data ?? []).map((row: any): SuggestedCreator => ({
        userId: row.user_id,
        username: row.username || '',
        displayName: row.display_name || 'Unknown',
        avatarUrl: row.avatar_url,
        isVerified: row.is_verified || false,
        handicap: row.handicap,
        homeCourse: row.home_course,
        totalEngagement: Number(row.total_engagement) || 0,
        videoCount: Number(row.video_count) || 0,
        isFollowed: row.is_followed || false,
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
