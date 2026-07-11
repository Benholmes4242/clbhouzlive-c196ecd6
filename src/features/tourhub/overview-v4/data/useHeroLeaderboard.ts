/**
 * useHeroLeaderboard — Overview V4 hero mini-board.
 * Top-3 for live; final top-3 (with winner flagged) for completed.
 * sr_leaderboards is keyed by tournament_id (confirmed via schema).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

export interface HeroLeaderboardEntry {
  position: number;
  isTied: boolean;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  scoreDisplay: string;
  thru: number | null;
  isWinner: boolean;
}

function formatScore(score: number | null | undefined): string {
  if (score == null) return 'E';
  if (score === 0) return 'E';
  return score < 0 ? String(score) : `+${score}`;
}

export function useHeroLeaderboard(tournamentId: string | undefined, opts: { live: boolean }) {
  return useQuery({
    queryKey: ['overview-v4', 'hero-leaderboard', tournamentId],
    queryFn: async (): Promise<HeroLeaderboardEntry[]> => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          position, score, thru, player_id,
          player:sr_players!sr_leaderboards_player_id_fkey (
            id, full_name, photo_url
          )
        `)
        .eq('tournament_id', tournamentId)
        .not('position', 'is', null)
        .lte('position', 3)
        .order('position', { ascending: true })
        .limit(8);
      if (error || !data) return [];

      const rows: HeroLeaderboardEntry[] = [];
      const byPos = new Map<number, number>();
      for (const r of data as any[]) {
        if (!r.player) continue;
        const pos = Number(r.position);
        byPos.set(pos, (byPos.get(pos) ?? 0) + 1);
      }
      for (const r of data as any[]) {
        if (!r.player) continue;
        const pos = Number(r.position);
        rows.push({
          position: pos,
          isTied: (byPos.get(pos) ?? 0) > 1,
          playerId: r.player.id,
          playerName: r.player.full_name,
          photoUrl:
            getPlayerHeadshotUrl(r.player.full_name, 'pga') ||
            r.player.photo_url ||
            null,
          scoreDisplay: formatScore(r.score),
          thru: r.thru ?? null,
          isWinner: !opts.live && pos === 1 && (byPos.get(pos) ?? 0) === 1,
        });
      }
      return rows.slice(0, 3);
    },
    enabled: !!tournamentId,
    staleTime: opts.live ? 30_000 : 60 * 60 * 1000,
    refetchInterval: opts.live ? 60_000 : false,
  });
}
