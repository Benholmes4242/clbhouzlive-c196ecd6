import { useGamRpc } from './_useGamRpc';
import type { LegendCategory } from '@/lib/gam/types';

export interface LegendPulseRow {
  pulse_id: string;
  kind: 'threat' | 'chase' | 'win';
  course_id: string;
  course_name: string;
  category: LegendCategory;
  category_value: number | null;
  counterparty_user_id: string | null;
  counterparty_name: string | null;
  viewer_rank: number | null;
  viewer_value: number | null;
  gap_to_first: number | null;
  occurred_at: string;
}

export function useLegendPulse(
  userId: string | undefined,
  days: number = 14,
) {
  return useGamRpc<LegendPulseRow[]>(
    'get_legend_pulse',
    userId
      ? { p_user_id: userId, p_days: days }
      : ({} as { p_user_id: string; p_days: number }),
    {
      enabled: Boolean(userId),
      staleTime: 60_000,
    },
  );
}
