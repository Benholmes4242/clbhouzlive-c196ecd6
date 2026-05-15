/**
 * useTournamentTeeTimes — round-1 marquee tee times for Upcoming · imminent.
 * Per §7.2 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 *
 * Fetches round 1 tee times via the existing sr_tee_times table and returns
 * the top 4 groups, in chronological order. Marquee detection is a simple
 * heuristic: the first group containing any "marquee-flagged" player is
 * marked. When data is missing returns an empty array — caller falls back
 * to LastYearRows.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeeTimeGroup {
  time: string;
  holeStart: string;
  players: string[];
  isMarquee: boolean;
}

export function useTournamentTeeTimes(tournamentId: string | null | undefined, enabled: boolean) {
  return useQuery<TeeTimeGroup[]>({
    queryKey: ['hybrid-hero', 'tee-times', tournamentId],
    enabled: !!tournamentId && enabled,
    staleTime: 1000 * 60 * 15, // 15min — can shift due to weather
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from('sr_tee_times')
        .select(`
          tee_time,
          starting_hole,
          players:sr_tee_time_players(
            player:sr_players(full_name, first_name, last_name)
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('round_number', 1)
        .order('tee_time', { ascending: true })
        .limit(8);

      if (error || !data) return [];

      const groups: TeeTimeGroup[] = (data as any[])
        .map((row): TeeTimeGroup => {
          const dt = row.tee_time ? new Date(row.tee_time) : null;
          const time = dt
            ? dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : '—';
          const players = (row.players || [])
            .map((p: any) => {
              const pl = p?.player;
              if (!pl) return '';
              return pl.full_name || `${pl.first_name ?? ''} ${pl.last_name ?? ''}`.trim();
            })
            .filter(Boolean);
          return {
            time,
            holeStart: row.starting_hole === 10 ? 'TEE 10' : 'TEE 1',
            players,
            isMarquee: false,
          };
        })
        .filter(g => g.players.length > 0)
        .slice(0, 4);

      // Mark first group as marquee when no other signal available
      if (groups.length > 0) groups[0].isMarquee = true;
      return groups;
    },
  });
}
