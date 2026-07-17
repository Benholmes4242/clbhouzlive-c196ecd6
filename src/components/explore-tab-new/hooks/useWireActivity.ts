import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WireFeatType =
  | 'ace'
  | 'albatross'
  | 'under_par'
  | 'eagle'
  | 'pb_gross'
  | 'pb_stableford'
  | 'birdie_haul'
  | 'stableford';

export type WireFeatTone = 'gold' | 'amber' | 'plain';

export interface WireActivityRow {
  friend_user_id: string;
  friend_name: string;
  friend_avatar: string | null;
  connection_id: string;
  score_id: string;
  play_date: string;
  course_name: string;
  course_image: string | null;
  feat_type: WireFeatType;
  feat_value: string;
  feat_tone: WireFeatTone;
}

/**
 * Global live-wire achievements ticker source.
 *
 * Backed by the parameterless `get_wire_activity` RPC — the server curates a
 * global, time-decayed feed of notable rounds across all users. No userId in
 * the query key: the wire is global. A 5-minute refetchInterval lets the bar
 * self-refresh while Discover sits open so new feats push old ones out
 * without a visit.
 */
export function useWireActivity() {
  return useQuery({
    queryKey: ['wire-activity'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<WireActivityRow[]> => {
      const { data, error } = await supabase.rpc('get_wire_activity');
      if (error) {
        console.error('[useWireActivity]', error);
        if (import.meta.env.DEV) throw error;
        return [];
      }
      return (data as WireActivityRow[]) ?? [];
    },
  });
}
