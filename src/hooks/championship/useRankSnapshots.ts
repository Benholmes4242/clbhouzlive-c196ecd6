import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankSnapshot {
  id: string;
  user_id: string;
  season_id: string;
  snapshot_date: string;
  rank_at_snapshot: number;
  courses_at_snapshot: number;
}

export function useRankSnapshots(userId?: string, seasonId?: string, days = 7) {
  return useQuery({
    queryKey: ['rank-snapshots', userId, seasonId, days],
    enabled: !!userId && !!seasonId,
    queryFn: async (): Promise<RankSnapshot[]> => {
      if (!userId || !seasonId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_rank_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((s: any): RankSnapshot => ({
        id: s.id,
        user_id: s.user_id,
        season_id: s.season_id,
        snapshot_date: s.snapshot_date,
        rank_at_snapshot: s.rank_at_snapshot,
        courses_at_snapshot: s.courses_at_snapshot,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
