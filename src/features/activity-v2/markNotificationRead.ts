import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ActivityFeedRowV2 } from './hooks/useActivityFeedV2';

/**
 * The ONE single-notification mark-read. Used by Activity row taps and by
 * the app-shell push-tap effect (`?n=<id>`).
 *
 * Writes BOTH read-state columns: `read` is abandoned but must never drift
 * further from `is_read`. Patches the local 'activity-v2' cache optimistically,
 * then invalidates the unread counts that drive every badge.
 */
export async function markNotificationRead(qc: QueryClient, notifId: string): Promise<void> {
  type FeedCache = { pages: ActivityFeedRowV2[][]; pageParams: unknown[] };
  qc.setQueriesData<FeedCache>({ queryKey: ['activity-v2'] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((p) =>
        p.map((r) => (r.notif_id === notifId ? { ...r, is_read: true } : r)),
      ),
    };
  });
  await supabase.from('notifications').update({ is_read: true, read: true }).eq('id', notifId);

  qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
  qc.invalidateQueries({ queryKey: ['actor-unread-counts'] });
  qc.invalidateQueries({ queryKey: ['records-unread-count'] });
}
