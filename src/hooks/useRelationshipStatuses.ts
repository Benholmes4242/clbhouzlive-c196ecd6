/**
 * Batch relationship status lookup — replaces N+1 per-row useRelationshipStatus calls.
 * Uses the get_relationship_statuses RPC to fetch all statuses in a single query.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';

export interface RelationshipStatusRow {
  target_user_id: string;
  is_following: boolean;
  is_followed_by: boolean;
  friend_status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  is_blocked: boolean;
  is_blocking: boolean;
}

export type RelationshipStatusMap = Record<string, RelationshipStatusRow>;

export function useRelationshipStatuses(targetUserIds: string[]) {
  const { user } = useSupabaseSession();

  return useQuery<RelationshipStatusMap>({
    queryKey: ['relationship-statuses', user?.id, targetUserIds],
    queryFn: async () => {
      if (!user || targetUserIds.length === 0) return {};

      const { data, error } = await supabase.rpc('get_relationship_statuses' as string, {
        p_current_user_id: user.id,
        p_target_user_ids: targetUserIds,
      });

      if (error) {
        AppLog.error('[useRelationshipStatuses]', 'Batch fetch failed:', error);
        throw error;
      }

      const map: RelationshipStatusMap = {};
      ((data as RelationshipStatusRow[]) ?? []).forEach((row) => {
        map[row.target_user_id] = row;
      });
      return map;
    },
    enabled: !!user && targetUserIds.length > 0,
    staleTime: 30_000,
  });
}
