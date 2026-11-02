/**
 * ACTIVE RING — one batched get_recent_activity read per surface (never one
 * per card). Accounts with nothing in the last 48 hours are absent from the
 * map. The RPC reads at most 100 ids, so callers pass ids in display order.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { RecentActivity, RecentActivityKind } from './activeRingRules';

export type { RecentActivity } from './activeRingRules';

const EMPTY = new Map<string, RecentActivity>();

export function useRecentActivity(ids: string[]): Map<string, RecentActivity> {
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  const sortedKey = [...ids].sort().join(',');
  const q = useQuery({
    queryKey: ['recent-activity', viewerId, sortedKey],
    enabled: !!viewerId && ids.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_activity', { p_actor_ids: ids.slice(0, 100) });
      if (error) throw error;
      const map = new Map<string, RecentActivity>();
      for (const row of data ?? []) {
        map.set(row.actor_id, {
          actor_id: row.actor_id,
          kind: row.kind as RecentActivityKind,
          post_id: row.post_id,
          created_at: row.created_at,
          course_name: row.course_name ?? null,
        });
      }
      return map;
    },
  });
  return q.data ?? EMPTY;
}
