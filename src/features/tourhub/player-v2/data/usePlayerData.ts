/** Player detail reads are exclusively header-season scoped. Null/error payloads
 * never borrow another season. Pick history follows the inspected public RPC JSON. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
type Functions = Database['public']['Functions'];
export type PlayerHeader = Functions['get_player_header']['Returns'][number];
export type PlayerResult = Functions['get_player_season_results']['Returns'][number];
export type PlayerHoles = Functions['get_player_hole_scoring']['Returns'][number];
export type PlayerStat = Functions['get_player_stat_percentiles']['Returns'][number];
export interface PlayerPick { won: boolean; name: string; end_date: string; position: string; tournament_id: string }
export interface PlayerPickHistory { picks: PlayerPick[]; member_picks: number }
export function parsePickHistory(data: Json): PlayerPickHistory | null {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.picks)) return null;
  const picks = data.picks.flatMap(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.won !== 'boolean' || typeof row.name !== 'string' || typeof row.position !== 'string' || typeof row.end_date !== 'string' || typeof row.tournament_id !== 'string') return [];
    return [{ won: row.won, name: row.name, position: row.position, end_date: row.end_date, tournament_id: row.tournament_id }];
  });
  return { picks, member_picks: typeof data.member_picks === 'number' ? data.member_picks : 0 };
}
export function usePlayerHeader(playerId: string) {
  return useQuery({ queryKey: ['player-v3', 'header', playerId], enabled: !!playerId, staleTime: 300_000, queryFn: async () => {
    const { data, error } = await supabase.rpc('get_player_header', { p_player_id: playerId });
    if (error) throw error; return data?.[0] ?? null;
  } });
}
export function usePlayerSeasonResults(playerId: string, year: number | null) {
  return useQuery({ queryKey: ['player-v3', 'results', playerId, year], enabled: !!playerId && year != null, staleTime: 300_000, queryFn: async () => {
    if (year == null) return [];
    const { data, error } = await supabase.rpc('get_player_season_results', { p_player_id: playerId, p_year: year });
    if (error) throw error; return data ?? [];
  } });
}
export function usePlayerHoleScoring(playerId: string, year: number | null) {
  return useQuery({ queryKey: ['player-v3', 'holes', playerId, year], enabled: !!playerId && year != null, staleTime: 300_000, queryFn: async () => {
    if (year == null) return null;
    const { data, error } = await supabase.rpc('get_player_hole_scoring', { p_player_id: playerId, p_year: year });
    if (error) throw error; return data?.[0] ?? null;
  } });
}
export function usePlayerStatPercentiles(playerId: string, year: number | null) {
  return useQuery({ queryKey: ['player-v3', 'stats', playerId, year], enabled: !!playerId && year != null, staleTime: 300_000, queryFn: async () => {
    if (year == null) return [];
    const { data, error } = await supabase.rpc('get_player_stat_percentiles', { p_player_id: playerId, p_year: year });
    if (error) throw error; return data ?? [];
  } });
}
export function usePlayerPickHistory(playerId: string, year: number | null) {
  return useQuery({ queryKey: ['player-v3', 'picks', playerId, year], enabled: !!playerId && year != null, staleTime: 300_000, queryFn: async () => {
    if (year == null) return null;
    const { data, error } = await supabase.rpc('get_player_pick_history', { p_player_id: playerId, p_year: year });
    if (error) throw error; return parsePickHistory(data);
  } });
}
/** Preserve fedex_rank / tour_season_rankings position as the existing race
 * authority, but scope this isolated reader to the header year. No fallback. */
export function usePlayerRaceRank(playerId: string, tour: string, year: number | null) {
  return useQuery({ queryKey: ['player-v3', 'race', playerId, tour, year], enabled: !!playerId && year != null, staleTime: 300_000, queryFn: async () => {
    if (year == null) return null;
    if (tour === 'pga') {
      const { data, error } = await supabase.from('sr_player_statistics').select('fedex_rank,sr_seasons!inner(year,tour_name)').eq('player_id', playerId).eq('sr_seasons.year', year).eq('sr_seasons.tour_name', 'pga').limit(1).maybeSingle();
      if (error) throw error; return data?.fedex_rank ?? null;
    }
    const { data, error } = await supabase.from('tour_season_rankings').select('position').eq('player_id', playerId).eq('tour_code', tour).eq('season_year', year).limit(1).maybeSingle();
    if (error) throw error; return data?.position ?? null;
  } });
}