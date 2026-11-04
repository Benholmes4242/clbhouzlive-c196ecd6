/** Tournament-pick insights use the four published RPCs only. Member rows are
 * viewer-keyed; event-owned tour/year must be supplied, never device defaults. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getGuestUser } from '@/features/guest/guestGateStore';
export interface RecordPick { player_id: string; player_name: string; position: number | null; tied: boolean; status: string | null; percentile: number | null; score?: number | null }
export interface PickRecord { tours: string[]; picks: number; event_count?: number; best?: { events: number; wins: number; top10: number; avg_percentile: number | null }; won: number; top10: number; avg_percentile: number | null; first_event_date: string | null; events: { tournament_id: string; name: string; end_date: string; picks: RecordPick[] }[] }
export interface FitStat { player_id: string; stat: string; value: number; percentile: number; players: number; wins: number }
export interface BeatRow { user_id: string; display_name: string | null; username: string | null; profile_photo_url: string | null; picks: number; wins: number; top10: number; avg_percentile: number; is_viewer: boolean }
export function useOurPickRecord(tour: string, year: number | null) {
  return useQuery({ queryKey: ['tourhub', 'our-pick-record', tour, year], enabled: Boolean(tour && year), staleTime: 60_000,
    queryFn: async (): Promise<PickRecord | null> => {
      if (year == null) return null;
      const { data, error } = await supabase.rpc('get_our_pick_record', { p_tour: tour, p_year: year });
      if (error) throw error;
      return data as unknown as PickRecord | null;
    } });
}
export function useBeatTheModel(tour: string, year: number | null) {
  const { user } = useSupabaseSession();
  return useQuery({ queryKey: ['tourhub', 'beat-the-model', tour, year, user?.id], enabled: Boolean(tour && year && user && !user.is_anonymous && !getGuestUser()), staleTime: 60_000,
    queryFn: async (): Promise<BeatRow[]> => {
      if (year == null) return [];
      const { data, error } = await supabase.rpc('get_beat_the_model', { p_tour: tour, p_year: year });
      if (error) throw error;
      return data ?? [];
    } });
}
export function usePickFit(tournamentId: string, playerIds: string[]) {
  return useQuery({ queryKey: ['tourhub', 'pick-fit', tournamentId, playerIds], enabled: Boolean(tournamentId && playerIds.length), staleTime: 60_000,
    queryFn: async (): Promise<FitStat[]> => {
      const { data, error } = await supabase.rpc('get_pick_fit', { p_tournament_id: tournamentId, p_player_ids: playerIds });
      if (error) throw error;
      return data ?? [];
    } });
}
export function useEventWinningScores(tournamentId: string) {
  return useQuery({ queryKey: ['tourhub', 'event-winning-scores', tournamentId], enabled: Boolean(tournamentId), staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_winning_scores', { p_tournament_id: tournamentId });
      if (error) throw error;
      return data ?? [];
    } });
}