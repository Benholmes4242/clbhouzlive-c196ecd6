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
  message?: string;
}

// Empty state messages based on status
const EMPTY_MESSAGES = {
  upcoming: "Leaderboard will appear when play begins.",
  live: "Leaderboard loading…",
  complete: "Historical results are syncing.",
} as const;

export function useLeaderboard(tour: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub-leaderboard', tour, eventId],
    queryFn: async () => {
      // Guard against missing params
      if (!tour || !eventId) {
        return null;
      }
      
      // Call the resolver edge function (POST body avoids query param issues)
      const { data, error } = await supabase.functions.invoke('tourhub-resolver', {
        method: 'POST',
        body: { tour, event: eventId },
      });

      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 404) return null;
        throw new Error(`Resolver error: ${status || 'unknown'}`);
      }

      const dataObj = data as any;
      
      // Normalize the response
      const leaders = (dataObj.leaders || []).map((l: Record<string, unknown>) => ({
        position: String(l.pos || l.position || '-'),
        athleteId: l.athleteId ? String(l.athleteId) : undefined,
        playerName: String(l.name || l.playerName || 'Unknown'),
        score: String(l.score || '-'),
        today: l.today ? String(l.today) : '-',
        thru: l.thru ? String(l.thru) : '-',
      }));

      const status = (dataObj.status as keyof typeof EMPTY_MESSAGES) || 'upcoming';

      return {
        tour: dataObj.tour || tour,
        espn_event_id: dataObj.espnEventId || eventId,
        leaders,
        fetched_at: dataObj.generatedAt || new Date().toISOString(),
        round: null,
        status: dataObj.status || null,
        message: leaders.length === 0 ? (dataObj.message || EMPTY_MESSAGES[status]) : undefined,
      } as LeaderboardSnapshot;
    },
    staleTime: 30 * 1000, // 30 seconds for live data
    retry: 1, // Only retry once to avoid hammering API
    enabled: Boolean(tour) && Boolean(eventId) && eventId.length > 0,
  });
}
