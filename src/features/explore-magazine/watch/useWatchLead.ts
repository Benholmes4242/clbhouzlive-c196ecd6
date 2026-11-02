/**
 * WS1 — THE WATCH LEAD READ. get_watch_lead() returns zero or one row: the
 * newest creator video from the last 7 days (reason 'creator_new'), otherwise
 * the most-liked video of the last 30 (reason 'most_liked'). Signed-in only —
 * the RPC returns nothing for a guest and the query is disabled without a
 * userId, so guests never see the lead.
 *
 * ERRORED IS NOT EMPTY: the query throws; the lead renders nothing on error
 * rather than collapsing into a false "no lead" state.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface WatchLeadRow {
  post_id: string;
  reason: 'creator_new' | 'most_liked';
  actor_type: 'personal' | 'business';
  actor_id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  is_verified: boolean;
  caption: string | null;
  media_url: string | null;
  hls_url: string | null;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  course_id: string | null;
  course_name: string | null;
}

export function useWatchLead(enabled: boolean) {
  return useQuery({
    queryKey: ['watch-lead'],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_lead' as never);
      if (error) throw error;
      const rows = (data ?? []) as unknown as WatchLeadRow[];
      return rows[0] ?? null;
    },
  });
}
