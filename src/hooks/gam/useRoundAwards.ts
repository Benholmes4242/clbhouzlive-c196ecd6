import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type RoundAwardUnitKind =
  | 'round_gross'
  | 'round_diff'
  | 'round_stableford'
  | 'front_nine'
  | 'back_nine'
  | 'finish_six'
  | 'hole';

export interface RoundAwardRow {
  award_kind: string;
  unit_kind: RoundAwardUnitKind;
  unit_key: number;
  tier: 'gold' | 'silver' | 'bronze';
  value: number | null;
  previous_value: number | null;
  delta: number | null;
  rank_here: number | null;
  attempts_at_detection: number | null;
}

export interface RoundEffortRow {
  unit_kind: Exclude<RoundAwardUnitKind, 'round_diff' | 'hole'>;
  value: number;
  rank_here: number | null;
  top_ten: boolean;
  attempts: number;
}

export interface RoundAwardsResult {
  awards: RoundAwardRow[];
  efforts: RoundEffortRow[];
}

function isRoundAwardsResult(value: unknown): value is RoundAwardsResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { awards?: unknown; efforts?: unknown };
  return Array.isArray(candidate.awards) && Array.isArray(candidate.efforts);
}

export function useRoundAwards(scoreId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['round-awards', scoreId],
    enabled: enabled && !!scoreId,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<RoundAwardsResult | null> => {
      if (!scoreId) return null;
      const { data, error } = await supabase.rpc('get_round_awards', { p_score_id: scoreId });
      if (error || !isRoundAwardsResult(data)) return null;
      return data;
    },
  });
}