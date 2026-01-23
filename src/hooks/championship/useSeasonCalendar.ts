import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Season {
  season_id: string;
  season_number: number;
  name: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  is_current: boolean;
  days_remaining: number | null;
  days_until_start: number | null;
}

export function useSeasonCalendar() {
  return useQuery({
    queryKey: ['season-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_season_calendar');
      if (error) throw error;
      return data as Season[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
