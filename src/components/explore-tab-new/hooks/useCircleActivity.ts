import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CircleFeatType =
  | 'ace'
  | 'albatross'
  | 'under_par'
  | 'eagle'
  | 'pb_gross'
  | 'pb_stableford'
  | 'birdie_haul'
  | 'stableford';

export type CircleFeatTone = 'gold' | 'amber' | 'plain';

export interface CircleActivityRow {
  friend_user_id: string;
  friend_name: string;
  friend_avatar: string | null;
  connection_id: string;
  score_id: string;
  play_date: string;
  course_name: string;
  course_image: string | null;
  feat_type: CircleFeatType;
  feat_value: string;
  feat_tone: CircleFeatTone;
}

export function useCircleActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ['circle-activity', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<CircleActivityRow[]> => {
      const { data, error } = await supabase.rpc('get_circle_activity', {
        p_user_id: userId!,
      } as any);
      if (error) {
        console.error('[useCircleActivity]', error);
        if (import.meta.env.DEV) throw error;
        return [];
      }
      return (data as CircleActivityRow[]) ?? [];
    },
  });
}
