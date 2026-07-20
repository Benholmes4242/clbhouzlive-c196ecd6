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

const DAY_MS = 86_400_000;

/**
 * C4-1: Member 360 activity - one bounded pull, 30 days.
 * SELECT created_at, name WHERE user_id = ? gte 30d limit 20000.
 * The card failing must never block the sheet - the caller should
 * treat errors as recoverable.
 */
export function useMemberActivity(userId: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'member-activity', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<MemberActivity> => {
      const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, name')
        .eq('user_id', userId!)
        .gte('created_at', since)
        .limit(20000);
      if (error) throw error;
      const rows = (data ?? []) as { created_at: string; name: string }[];

      // Build 30 daily buckets (oldest -> newest).
      const buckets = new Map<string, number>();
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * DAY_MS);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      let sessions = 0;
      let lastSessionAt: string | null = null;
      for (const r of rows) {
        const key = r.created_at.slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
        if (r.name === 'session_start') {
          sessions += 1;
          if (!lastSessionAt || r.created_at > lastSessionAt) lastSessionAt = r.created_at;
        }
      }
      const daily = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
      const activeDays = daily.filter(d => d.count > 0).length;
      const avgPerActiveDay = activeDays === 0
        ? 0
        : Math.round((rows.length / activeDays) * 10) / 10;
      return {
        totalEvents: rows.length,
        sessions,
        lastSessionAt,
        activeDays,
        avgPerActiveDay,
        daily,
      };
    },
  });
}
