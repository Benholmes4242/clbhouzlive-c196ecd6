import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_admin_command_centre(p_tz) — one round trip for every Command centre
 * figure the older RPCs do not carry. Typed EXACTLY from the function's real
 * output (12 Oct 2026). Counters are rolling 7x24h windows from now, not
 * calendar days, so they legitimately differ from older tiles; do not reconcile.
 * rounds_by_day.dow is 0 = Monday .. 6 = Sunday.
 *
 * A permission-denied RAISE propagates as a query error. Callers render empty
 * panel shells on error — never fabricated zeros.
 */
export interface CommandCentre {
  loop: { joined: number; connected: number; round_in: number; posted: number; weekly: number; never_connected: number; d30_connected_pct: number | null; d30_not_connected_pct: number | null };
  moat: { rounds_total: number; holes_total: number; courses_played: number; catalogue_total: number; reviews_total: number; rounds_7d: number; holes_7d: number; reviews_7d: number; rounds_daily_28: { date: string; n: number }[]; reviews_daily_28: { date: string; n: number }[]; courses_played_daily_28: { date: string; cumulative: number }[] };
  do_now: { stuck_rounds: { rounds: number; members: number; oldest_days: number }; played_not_connected: { members: number; oldest_days: number }; gone_quiet: { members: number; oldest_days: number; names: { user_id: string; display_name: string | null; last_seen_at: string }[] }; inbox: { claims: number; course_requests: number; tickets: number; oldest_days: number } };
  growth: { signups_7d: number; signups_prev_7d: number; signups_daily_14: { date: string; n: number }[]; invites_sent_7d: number; invites_joined_7d: number };
  rounds_by_day: { date: string; dow: number; n: number }[];
  rounds_7d_members: number;
  rounds_prev_7d: number;
  clubhouse: { posts_7d: number; posts_prev_7d: number; reactions_7d: number; reactions_per_post: number; reviews_7d: number; reviews_prev_7d: number; unseen_7d: number; top: { post_id: string; user_id: string; display_name: string | null; avatar_url: string | null; like_count: number; comment_count: number; gross: number | null; to_par: number | null; course_name: string | null; created_at: string; unseen: boolean }[] };
  computed_at: string;
}

export const COMMAND_CENTRE_KEY = ['admin', 'command-centre'] as const;

async function fetchCommandCentre(): Promise<CommandCentre> {
  const p_tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error } = await supabase.rpc('get_admin_command_centre' as never, { p_tz } as never);
  if (error) throw error;
  if (!data) throw new Error('get_admin_command_centre returned no payload');
  return data as unknown as CommandCentre;
}

export function useCommandCentre() {
  const qc = useQueryClient();
  // The key sits outside ['admin-v2'], so the page-wide refetch event does not
  // reach it through prefix invalidation; it listens for itself.
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: COMMAND_CENTRE_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  return useQuery({
    queryKey: COMMAND_CENTRE_KEY,
    queryFn: fetchCommandCentre,
    staleTime: 60_000,
  });
}
