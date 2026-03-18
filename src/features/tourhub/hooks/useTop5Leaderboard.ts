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
          player:sr_players!sr_leaderboards_player_id_fkey (
            id, full_name, photo_url
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
      for (const row of data) {
        if (!row.player) continue;
        const player = row.player as any;
        const pos = Number(row.position);
        const entry: Top5Entry = {
          position: pos,
          isTied: false, // set below
          playerId: player.id,
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
