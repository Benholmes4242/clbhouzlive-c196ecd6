import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerRatingBreakdown {
  base_rating: number;
  form_modifier: number;
  form_scoring: number;
  form_sg: number;
  form_results: number;
  world_ranking: number;
  scoring_percentile: number;
  sg_percentile: number;
  ranking_percentile: number;
  results_percentile: number;
  ball_striking_percentile: number;
  short_game_percentile: number;
  power_percentile: number;
  total_events: number;
  events_2025: number;
  events_2026: number;
  weight_2025: number;
  weight_2026: number;
}

export interface PlayerRating {
  id: string;
  player_id: string;
  rating: number;
  tier: 'elite' | 'world_class' | 'tour_proven' | 'competitive' | 'developing';
  previous_rating: number | null;
  rating_delta: number;
  breakdown: PlayerRatingBreakdown;
  scouting_report: string | null;
  events_minimum_met: boolean;
}

export const TIER_CONFIG = {
  elite: { label: 'Elite', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', description: 'The best in the world' },
  world_class: { label: 'World Class', color: '#22C55E', bgColor: 'rgba(34,197,94,0.1)', description: 'Major contenders' },
  tour_proven: { label: 'Tour Proven', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)', description: 'Consistent competitors' },
  competitive: { label: 'Competitive', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.1)', description: 'Mid-pack performers' },
  developing: { label: 'Developing', color: '#CBD5E1', bgColor: 'rgba(203,213,225,0.1)', description: 'Early career' },
} as const;

export function usePlayerRating(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-rating', playerId],
    queryFn: async () => {
      if (!playerId) return null;

      const { data, error } = await (supabase as any)
        .from('player_ratings')
        .select('*')
        .eq('player_id', playerId)
        .order('computed_at', { ascending: false })
        .limit(1)
      .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return data as unknown as PlayerRating;
    },
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000,
  });
}
