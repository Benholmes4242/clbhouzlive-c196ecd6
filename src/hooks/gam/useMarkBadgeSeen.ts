import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserBadge } from '@/lib/gam/types';

const LIST_KEY = ['gam_rpc', 'get_user_achievements_for_viewer'] as const;

/**
 * Marks ONE badge seen when the member opens that badge's detail view.
 * Optimistic and never blocking: the marker clears in the UI immediately,
 * an RPC failure is logged and otherwise ignored — on next load the marker
 * simply returns, which is the correct fallback. Never called in bulk;
 * opening the room itself marks nothing.
 */
export function useMarkBadgeSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('gam_mark_badge_seen', { p_badge_id: badgeId });
      if (error) throw error;
    },
    onMutate: (badgeId) => {
      // Clear the marker in every cached badge list (self and friend views)
      // so it does not reappear when navigating back within the session.
      qc.setQueriesData<UserBadge[]>({ queryKey: LIST_KEY }, (old) =>
        old?.map((b) => (b.badge_id === badgeId ? { ...b, seen_by_user: true } : b)),
      );
    },
    onError: (error) => {
      console.warn('[gam] gam_mark_badge_seen failed; marker returns on next load', error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
