import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

export interface Top5Entry {
  position: number;
  isTied: boolean;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  scoreDisplay: string; // formatted: '-13', 'E', '+2'
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score < 0 ? String(score) : `+${score}`;
}

export function useTop5Leaderboard(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['top5-leaderboard', tournamentId],
    queryFn: async (): Promise<Top5Entry[]> => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          position,
          score,
          player_id,
          team_id,
          player:sr_players!sr_leaderboards_player_id_fkey (
            id, full_name, photo_url
          ),
          team:sr_teams!sr_leaderboards_team_id_fkey (
            id, display_name, abbr_name,
            members:sr_team_players(
              position_in_team,
              player:sr_players!sr_team_players_player_id_fkey(id, full_name, photo_url)
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .not('position', 'is', null)
        .lte('position', 5)
        .order('position', { ascending: true })
        .limit(12); // fetch extra to catch ties at position 5

      if (error || !data) return [];

      // Group rows by position to detect ties
      const byPos = new Map<number, Top5Entry[]>();
      for (const row of data as any[]) {
        let player = row.player;
        let entityId: string | null = null;
        if (!player && row.team) {
          const members = (row.team.members || [])
            .filter((m: any) => m.player)
            .sort((a: any, b: any) => a.position_in_team - b.position_in_team);
          const primary = members[0]?.player;
          player = {
            id: row.team.id,
            full_name: row.team.abbr_name || row.team.display_name || 'Team',
            photo_url: primary?.photo_url ?? null,
          };
          entityId = row.team.id;
        } else if (player) {
          entityId = player.id;
        }
        if (!player || !entityId) continue;

        const pos = Number(row.position);
        const entry: Top5Entry = {
          position: pos,
          isTied: false, // set below
          playerId: entityId,
          playerName: player.full_name,
          photoUrl: getPlayerHeadshotUrl(player.full_name, 'pga')
            || player.photo_url
            || null,
          scoreDisplay: formatScore(row.score as number | null),
        };
        if (!byPos.has(pos)) byPos.set(pos, []);
        byPos.get(pos)!.push(entry);
      }

      // Mark tied entries, take first player per position for display
      const result: Top5Entry[] = [];
      for (const [, entries] of byPos) {
        const isTied = entries.length > 1;
        entries.forEach(e => (e.isTied = isTied));
        result.push(entries[0]);
        if (result.length >= 5) break;
      }
      return result;
    },
    enabled: !!tournamentId,
    staleTime: 10 * 60 * 1000,
  });
}
