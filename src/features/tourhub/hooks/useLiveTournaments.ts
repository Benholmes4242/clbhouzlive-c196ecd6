import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../_shared/tourOrder';
import { resolveBoardEntity, teamNamesNeedInitials } from '../_shared/boardEntity';
import type { BoardEntry } from '../leaderboard/BoardTable';
import type { TourId } from './useOverviewData';

export interface LiveTournamentLite {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  venue_name: string | null;
  venue_course_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  venue_yardage: number | null;
  venue_par: number | null;
  defending_champion: string | null;
  tour_name: string | null;
  tourSlug: TourId;
  purse: number | null;
  currentRound: number | null;
  /** Leader of this tournament, from the leaderboard rows. */
  leaderName: string | null;
  /** How many players share the lowest total. */
  leaderCount: number;
  leaderToPar: number | null;
}

/** Tournaments that are in progress, OR scheduled with start_date === today (local). */
export function useLiveTournaments() {
  return useQuery({
    queryKey: ['tourhub', 'live-tournaments'],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<LiveTournamentLite[]> => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          'id, name, status, event_type, start_date, end_date, venue_name, venue_course_name, venue_city, venue_country, venue_yardage, venue_par, defending_champion, current_round, purse, season:sr_seasons(tour_name)'
        )
        .in('event_type', ['stroke', 'team'])
        .or(`status.eq.inprogress,and(status.in.(scheduled,created),start_date.eq.${todayStr})`)
        .order('purse', { ascending: false, nullsFirst: false });

      if (error) throw error;
      const rows = data ?? [];

      // Companion query: who leads each of these tournaments. Kept here rather
      // than in components so the menu never depends on a leaderboard page
      // having been visited first.
      const leaders = new Map<string, { name: string | null; count: number; toPar: number | null }>();
      const ids = rows.map((t: any) => t.id).filter(Boolean);
      if (ids.length > 0) {
        const { data: lb } = await supabase
          .from('sr_leaderboards')
          .select(`
            id, tournament_id, position, position_tied, score,
            player:sr_players!sr_leaderboards_player_id_fkey(id, sr_id, full_name, first_name, last_name),
            team:sr_teams!sr_leaderboards_team_id_fkey(
              id, sr_id, display_name, abbr_name,
              members:sr_team_players(position_in_team, player:sr_players!sr_team_players_player_id_fkey(id, full_name, photo_url))
            )
          `)
          .in('tournament_id', ids);
        const byTournament = new Map<string, BoardEntry[]>();
        for (const r of (lb ?? []) as any[]) {
          if (r.score === null || r.score === undefined) continue;
          const tid = r.tournament_id as string;
          const entry: BoardEntry = {
            id: r.id ?? `${tid}:${r.player?.id ?? r.team?.id ?? r.position}`,
            position: r.position ?? null,
            position_tied: r.position_tied ?? null,
            score: r.score ?? null,
            player: r.player
              ? { id: r.player.id, sr_id: r.player.sr_id ?? null, full_name: r.player.full_name ?? [r.player.first_name, r.player.last_name].filter(Boolean).join(' ') }
              : null,
            team: r.team
              ? { id: r.team.id, sr_id: r.team.sr_id ?? null, display_name: r.team.display_name ?? null, abbr_name: r.team.abbr_name ?? null, members: r.team.members ?? [] }
              : null,
          };
          const board = byTournament.get(tid) ?? [];
          board.push(entry);
          byTournament.set(tid, board);
        }
        for (const [tid, board] of byTournament.entries()) {
          const needsInitials = teamNamesNeedInitials(board);
          let leader: { name: string | null; count: number; toPar: number | null } | null = null;
          for (const entry of board) {
            if (entry.score == null) continue;
            const name = resolveBoardEntity(entry, needsInitials).prose || null;
            if (!leader || leader.toPar === null || entry.score < leader.toPar) {
              leader = { name, count: 1, toPar: entry.score };
            } else if (entry.score === leader.toPar) {
              leader = { ...leader, count: leader.count + 1 };
            }
          }
          if (leader) leaders.set(tid, leader);
        }
      }

      return rows.map((t: any) => {
        const lead = leaders.get(t.id);
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          start_date: t.start_date,
          end_date: t.end_date ?? null,
          venue_name: t.venue_name ?? null,
          venue_course_name: t.venue_course_name ?? null,
          venue_city: t.venue_city ?? null,
          venue_country: t.venue_country ?? null,
          venue_yardage: t.venue_yardage ?? null,
          venue_par: t.venue_par ?? null,
          defending_champion: t.defending_champion ?? null,
          tour_name: t.season?.tour_name ?? null,
          tourSlug: mapTourSlug(t.season?.tour_name ?? ''),
          purse: t.purse ?? null,
          currentRound: t.current_round ?? null,
          leaderName: lead?.name ?? null,
          leaderCount: lead?.count ?? 0,
          leaderToPar: lead?.toPar ?? null,
        };
      });
    },
  });
}

