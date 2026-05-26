import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DispatchMoment {
  id: string;
  tournamentId: string | null;
  headline: string;
  caption: string | null;
  durationSeconds: number | null;
  streamId: string | null;
  posterUrl: string | null;
  publishedAt: string;
}

/**
 * Pass 6: fetches the currently-featured editorial "Moment of the Week".
 * Returns null when no published, non-expired moment exists — that's a valid
 * state, not an error. DispatchModule renders nothing in that case.
 */
export function useDispatchMoment() {
  return useQuery({
    queryKey: ['tourhub', 'dispatch-moment'],
    queryFn: async (): Promise<DispatchMoment | null> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('tour_hub_dispatch_moments')
        .select(
          'id, tournament_id, headline, caption, duration_seconds, stream_id, poster_url, published_at'
        )
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('useDispatchMoment error:', error);
        return null;
      }
      if (!data) return null;

      return {
        id: data.id,
        tournamentId: data.tournament_id,
        headline: data.headline,
        caption: data.caption,
        durationSeconds: data.duration_seconds,
        streamId: data.stream_id,
        posterUrl: data.poster_url,
        publishedAt: data.published_at,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
