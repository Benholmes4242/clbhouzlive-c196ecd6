import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** The v2 RPC owns all windowed figures; failures remain empty panel shells. */
export type CommandCentreDays = 7 | 28 | 90;
export interface CommandCentreV2 {
  window_days: number;
  target: { members: number; members_goal: number; clubs: number; clubs_goal: number; deadline: string; signups: number; signups_prev: number; clubs_added: number };
  do_now: {
    stuck_rounds: { courses: number; rounds: number; members: number; oldest_days: number; items: { name: string; rounds: number; members: number }[] };
    gone_quiet: { members: number; items: { user_id: string; name: string; days: number }[] };
    clubs_to_pitch: { clubs: number; items: { club_id: string; name: string; members: number; connected: number }[] };
    first_rounds: { members: number; items: { user_id: string; name: string; gross: number | null; course: string | null }[] };
    unreacted: { posts: number; items: { post_id: string; name: string; kind: string; hours: number }[] };
    played_not_connected: number;
    inbox: number;
  };
  loop: { joined: number; connected: number; round_in: number; opened: number; posted: number; invited: number; could_connect: number; waiting_on_body: number; not_placed: number };
  coverage: { body: string; members: number; connected: number; waitlisted: number; live: boolean }[];
  clubs: { profiles: number; clubs_with_members: number; members_at_club: number; members: number; top: { name: string; members: number; connected: number; rounds: number; has_profile: boolean }[] };
  moat: { rounds_total: number; holes_total: number; reviews_total: number; courses_played: number; courses_measured: number; rounds_window: number; holes_window: number; reviews_window: number; rounds_buckets: { from: string; to: string; n: number }[]; holes_series: number[]; reviews_series: number[]; measured_series: number[] };
  clubhouse: { posts: number; posts_prev: number; reactions: number; video_posts: number; reviews: number; reviews_prev: number; top: { post_id: string; name: string; kind: string; course: string | null; gross: number | null; to_par: number | null; likes: number; comments: number }[]; creators: { name: string; posts: number; reactions: number }[] };
  retention: { d30_connected_n: number; d30_connected_returned: number; d30_not_n: number; d30_not_returned: number; cohorts: { week_start: string; n: number; cells: (number | null)[] }[] };
  hours: { current_hour: number; hours: { hour: number; today: number; last: number }[]; peak: number; peak_hour: number };
  computed_at: string;
}

export function useCommandCentreV2(days: CommandCentreDays) {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin', 'command-centre-v2'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);
  return useQuery({
    queryKey: ['admin', 'command-centre-v2', days],
    queryFn: async (): Promise<CommandCentreV2> => {
      const p_tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error } = await supabase.rpc('get_admin_command_centre_v2' as never, { p_tz, p_days: days } as never);
      if (error) throw error;
      if (!data) throw new Error('get_admin_command_centre_v2 returned no payload');
      return data as unknown as CommandCentreV2;
    },
    staleTime: 60_000,
  });
}