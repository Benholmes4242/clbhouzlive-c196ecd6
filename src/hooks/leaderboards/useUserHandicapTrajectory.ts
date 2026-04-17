import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface HandicapTrajectoryPoint {
  label: string;       // e.g. 'May'
  value: number;       // handicap index at month end
  recorded_at: string; // ISO timestamp of the latest reading in that month
}

export interface UserHandicapTrajectory {
  points: HandicapTrajectoryPoint[];
  best: number | null;            // lowest handicap in window (sharpest)
  worst: number | null;           // highest handicap in window
  yoy_improvement: number | null; // positive => improved (handicap dropped)
}

interface Options {
  userId?: string | null;
  enabled?: boolean;
}

/**
 * Returns the user's 12-month handicap trajectory, resampled to monthly.
 * Used by the Handicap tab's trajectory card.
 *
 * Returns null when there are <2 history points — caller should hide the card.
 */
export function useUserHandicapTrajectory(options: Options = {}) {
  const { user } = useSupabaseSession();
  const { userId = user?.id, enabled = true } = options;

  return useQuery({
    queryKey: ['user-handicap-trajectory', userId],
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<UserHandicapTrajectory | null> => {
      if (!userId) return null;

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, error } = await supabase
        .from('user_handicap_history')
        .select('handicap_value, recorded_at')
        .eq('user_id', userId)
        .gte('recorded_at', twelveMonthsAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('[useUserHandicapTrajectory] fetch error', error);
        return null;
      }
      if (!data || data.length < 2) return null;

      // Resample to monthly — keep the latest reading per calendar month.
      const byMonth: Record<string, { value: number; recorded_at: string }> = {};
      data.forEach((row) => {
        const d = new Date(row.recorded_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key] || row.recorded_at > byMonth[key].recorded_at) {
          byMonth[key] = { value: Number(row.handicap_value), recorded_at: row.recorded_at };
        }
      });

      const points: HandicapTrajectoryPoint[] = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            label: new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'short' }),
            value: v.value,
            recorded_at: v.recorded_at,
          };
        });

      if (points.length < 2) return null;

      const values = points.map((p) => p.value);
      const best = Math.min(...values);
      const worst = Math.max(...values);
      // YoY: oldest minus newest. Positive => handicap dropped => improvement.
      const yoy = points[0].value - points[points.length - 1].value;

      return { points, best, worst, yoy_improvement: yoy };
    },
  });
}
