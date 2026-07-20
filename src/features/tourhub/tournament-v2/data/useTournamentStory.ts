/**
 * useTournamentStory — port of the sr_tournament_summaries query used
 * by the legacy SummaryTab. Returns editorial-ready story text (built
 * from course_conditions / weather_conditions with a wind + temp coda)
 * plus the broadcast fields so EventInfo can surface a TV row.
 * Self-hides upstream when both story and broadcast are null.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentStory {
  story: string | null;
  broadcast: string | null;
}

interface SummaryRow {
  course_conditions: string | null;
  weather_conditions: string | null;
  temperature: number | null;
  wind_speed: number | null;
  wind_direction: string | null;
  broadcast_network: string | null;
  broadcast_cable: string | null;
  broadcast_internet: string | null;
}

function buildStory(row: SummaryRow): string | null {
  const bits: string[] = [];
  if (row.course_conditions) bits.push(String(row.course_conditions).trim());
  if (row.weather_conditions) bits.push(String(row.weather_conditions).trim());
  const climate: string[] = [];
  if (row.temperature != null) climate.push(`${row.temperature}°F`);
  if (row.wind_speed != null) {
    const dir = row.wind_direction ? ` ${row.wind_direction}` : '';
    climate.push(`winds${dir} ${row.wind_speed} mph`);
  }
  if (climate.length) bits.push(climate.join(', '));
  const text = bits.filter(Boolean).join(' — ');
  return text.length > 0 ? text : null;
}

function buildBroadcast(row: SummaryRow): string | null {
  const parts = [row.broadcast_network, row.broadcast_cable, row.broadcast_internet]
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}


export function useTournamentStory(tournamentId: string | null | undefined) {
  return useQuery<TournamentStory | null>({
    queryKey: ['tournament-v2', 'story', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!tournamentId) return null;
      const { data, error } = await supabase
        .from('sr_tournament_summaries')
        .select('course_conditions, weather_conditions, temperature, wind_speed, wind_direction, broadcast_network, broadcast_cable, broadcast_internet')
        .eq('tournament_id', tournamentId)
        .maybeSingle();
      if (error) throw error;

      if (!data) return { story: null, broadcast: null };
      return { story: buildStory(data), broadcast: buildBroadcast(data) };
    },
  });
}
