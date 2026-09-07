/**
 * MEMBER 360 ACTIVITY — SERVER-SIDE (Batch 4, 7 Sep 2026).
 *
 * This hook used to pull one member's raw analytics_events for 30 days and
 * bucket them in the browser. PostgREST returns at most 2000 rows whatever
 * `.limit()` says: the busiest account measured 24,472 events over 30 days, so
 * its totals, session count, active days and daily bars were all computed from
 * the oldest ~2000 rows — wrong, not approximate. Quiet accounts happened to be
 * right, which is the worst failure mode: the card looked correct until the
 * member you most wanted to inspect was the one it lied about.
 *
 * Now aggregated in Postgres behind admin-gated
 * get_admin_member_activity(p_user_id, p_days), returning one row.
 * A failure here must never block the Member 360 sheet — the caller treats
 * errors as recoverable.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberActivity {
  totalEvents: number;
  sessions: number;
  lastSessionAt: string | null;
  activeDays: number;
  avgPerActiveDay: number;
  daily: { date: string; count: number }[];
}

export function useMemberActivity(userId: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'member-activity', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<MemberActivity> => {
      const { data, error } = await supabase.rpc('get_admin_member_activity', {
        p_user_id: userId!,
        p_days: 30,
      });
      if (error) throw error;
      const p = (data ?? {}) as {
        total_events?: number;
        sessions?: number;
        last_session_at?: string | null;
        active_days?: number;
        avg_per_active_day?: number | string;
        daily?: { date: string; count: number }[];
      };
      return {
        totalEvents: Number(p.total_events ?? 0),
        sessions: Number(p.sessions ?? 0),
        lastSessionAt: p.last_session_at ?? null,
        activeDays: Number(p.active_days ?? 0),
        avgPerActiveDay: Number(p.avg_per_active_day ?? 0),
        daily: (p.daily ?? []).map(d => ({ date: String(d.date), count: Number(d.count ?? 0) })),
      };
    },
  });
}
