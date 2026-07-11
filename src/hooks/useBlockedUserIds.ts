import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Returns the set of user ids blocked BY or blocking the current user.
 * Used to hide blocked-author content across feed, comments, reviews, and messages.
 * Refreshes on the 'blocked-user-ids' query key so useBlockActions can invalidate.
 */
export function useBlockedUserIds(currentUserId?: string | null) {
  const { data } = useQuery({
    queryKey: ['blocked-user-ids', currentUserId ?? null],
    enabled: !!currentUserId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!currentUserId) return [] as string[];
      const { data: rows, error } = await supabase.rpc('get_blocked_user_ids', {
        _user_id: currentUserId,
      });
      if (error) {
        console.warn('[useBlockedUserIds] rpc failed', error.message);
        return [] as string[];
      }
      return (rows ?? []).map((r: { blocked_id: string }) => r.blocked_id);
    },
  });

  return useMemo(() => new Set<string>(data ?? []), [data]);
}
