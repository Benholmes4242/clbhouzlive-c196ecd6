import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TourHealth {
  tour_code: string;
  total_players: number;
  matched_players: number;
  last_updated: string | null;
}

const TOUR_CODES = ['euro', 'lpga', 'pgad', 'liv'] as const;

export function useTourRankingsHealth() {
  return useQuery({
    queryKey: ['tour-rankings-health'],
    queryFn: async () => {
      const now = new Date();
      const seasonYear = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();

      const { data, error } = await supabase
        .from('tour_season_rankings')
        .select('tour_code, player_id, updated_at')
        .eq('season_year', seasonYear);

      if (error) throw error;

      return TOUR_CODES.map(code => {
        const rows = (data ?? []).filter(r => r.tour_code === code);
        return {
          tour_code: code,
          total_players: rows.length,
          matched_players: rows.filter(r => r.player_id !== null).length,
          last_updated: rows.length > 0
            ? rows.reduce((max, r) => (r.updated_at && r.updated_at > max ? r.updated_at : max), '')
            : null,
        } satisfies TourHealth;
      });
    },
    refetchInterval: 60000,
  });
}
