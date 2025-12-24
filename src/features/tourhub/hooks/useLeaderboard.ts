import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  position: string;
  athleteId?: string;
  playerName: string;
  score: string;
  today?: string;
  thru?: string;
}

export interface LeaderboardSnapshot {
  tour: string;
  espn_event_id: string;
  leaders: LeaderboardEntry[];
  fetched_at: string;
  round: number | null;
  status: string | null;
}

export function useLeaderboard(tour: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub-leaderboard', tour, eventId],
    queryFn: async () => {
      // Guard against missing params - this should not happen if enabled is set correctly
      if (!tour || !eventId) {
        return null;
      }
      
      // First try DB snapshot
      const { data: dbData, error: dbError } = await supabase
        .from('tourhub_leaderboard_latest')
        .select('*')
        .eq('tour', tour)
        .eq('espn_event_id', eventId)
        .maybeSingle();
      
      if (dbData) {
        // Leaders are stored in the payload field
        const payload = dbData.payload as any;
        const leadersRaw = payload?.leaders || [];
        
        return {
          tour: dbData.tour,
          espn_event_id: dbData.espn_event_id,
          leaders: leadersRaw.map((l: any) => ({
            position: l.position || l.pos || '-',
            athleteId: l.athleteId,
            playerName: l.playerName || l.name || 'Unknown',
            score: l.score || '-',
            today: l.today || '-',
            thru: l.thru || '-',
          })),
          fetched_at: dbData.fetched_at,
          round: dbData.round,
          status: dbData.status,
        } as LeaderboardSnapshot;
      }
      
      // Fallback to edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('tourhub-leaderboard', {
        body: { tour, event: eventId },
      });
      
      if (fnError) throw fnError;
      
      if (fnData?.leaders) {
        return {
          tour,
          espn_event_id: eventId,
          leaders: fnData.leaders.map((l: any) => ({
            position: l.position || l.pos || '-',
            athleteId: l.athleteId,
            playerName: l.playerName || l.name || 'Unknown',
            score: l.score || '-',
            today: l.today || '-',
            thru: l.thru || '-',
          })),
          fetched_at: new Date().toISOString(),
          round: fnData.round || null,
          status: fnData.status || null,
        } as LeaderboardSnapshot;
      }
      
      return null;
    },
    staleTime: 30 * 1000, // 30 seconds for live data
    retry: 1, // Only retry once to avoid hammering API
    enabled: Boolean(tour) && Boolean(eventId) && eventId.length > 0,
  });
}
