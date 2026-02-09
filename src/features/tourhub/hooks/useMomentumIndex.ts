/**
 * useMomentumIndex - Categorizes players as Surging, Stable, or Sliding
 * 
 * Combines:
 * 1. Rank delta from sr_world_rankings (prior_rank - rank)
 * 2. Recent form from sr_leaderboards (avg finish last 3 events)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

export type MomentumCategory = 'surging' | 'stable' | 'sliding';

export interface MomentumPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  rank: number;
  rankDelta: number;
  recentResults: string[]; // e.g. ["T3", "T8", "T15"]
  avgFinish: number;
  category: MomentumCategory;
}

export interface MomentumIndexData {
  surging: MomentumPlayer[];
  stable: MomentumPlayer[];
  sliding: MomentumPlayer[];
}

function classifyMomentum(rankDelta: number, avgFinish: number): MomentumCategory {
  if (rankDelta > 5 && avgFinish <= 10) return 'surging';
  if (rankDelta < -5 && avgFinish > 40) return 'sliding';
  // Additional heuristics for more entries
  if (rankDelta > 10) return 'surging';
  if (rankDelta < -10) return 'sliding';
  return 'stable';
}

function formatPosition(pos: number | null): string {
  if (pos === null || pos === 0) return '—';
  if (pos === 1) return '1st';
  return `T${pos}`;
}

async function fetchMomentumIndex(): Promise<MomentumIndexData> {
  // Source 1: World rankings with rank delta
  const { data: rankings, error: rError } = await supabase
    .from('sr_world_rankings')
    .select(`
      rank,
      prior_rank,
      player:sr_players!inner(id, first_name, last_name, photo_url, pga_tour_id)
    `)
    .not('prior_rank', 'is', null)
    .order('rank', { ascending: true })
    .limit(200);

  if (rError || !rankings?.length) {
    return { surging: [], stable: [], sliding: [] };
  }

  // Source 2: Recent form — last 3 closed events per player
  const { data: recentResults, error: lError } = await supabase
    .from('sr_leaderboards')
    .select(`
      player_id,
      position,
      tournament:sr_tournaments!inner(id, name, end_date, status)
    `)
    .eq('tournament.status', 'closed')
    .not('position', 'is', null)
    .gt('position', 0)
    .order('tournament(end_date)', { ascending: false });

  // Build per-player recent form map
  const formMap = new Map<string, { positions: number[]; labels: string[] }>();

  if (!lError && recentResults) {
    for (const row of recentResults as any[]) {
      const pid = row.player_id;
      if (!formMap.has(pid)) {
        formMap.set(pid, { positions: [], labels: [] });
      }
      const entry = formMap.get(pid)!;
      if (entry.positions.length < 3) {
        entry.positions.push(row.position);
        entry.labels.push(formatPosition(row.position));
      }
    }
  }

  // Classify each ranked player
  const allPlayers: MomentumPlayer[] = rankings.map((row: any) => {
    const rankDelta = (row.prior_rank || row.rank) - row.rank;
    const player = row.player;
    const form = formMap.get(player.id);
    const avgFinish = form && form.positions.length > 0
      ? form.positions.reduce((a: number, b: number) => a + b, 0) / form.positions.length
      : 50; // Default to mid-field if no results

    return {
      playerId: player.id,
      firstName: player.first_name || '',
      lastName: player.last_name || '',
      photoUrl: resolvePhotoUrl(player.photo_url, player.pga_tour_id),
      rank: row.rank,
      rankDelta,
      recentResults: form?.labels || [],
      avgFinish,
      category: classifyMomentum(rankDelta, avgFinish),
    };
  });

  // Group and pick top 3 per category
  const surging = allPlayers
    .filter(p => p.category === 'surging')
    .sort((a, b) => b.rankDelta - a.rankDelta)
    .slice(0, 3);

  const sliding = allPlayers
    .filter(p => p.category === 'sliding')
    .sort((a, b) => a.rankDelta - b.rankDelta)
    .slice(0, 3);

  const stable = allPlayers
    .filter(p => p.category === 'stable')
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  return { surging, stable, sliding };
}

export function useMomentumIndex() {
  return useQuery({
    queryKey: ['momentum-index'],
    queryFn: fetchMomentumIndex,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
