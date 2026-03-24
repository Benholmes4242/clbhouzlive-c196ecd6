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
  sponsor_name: string | null;
  prize_description: string | null;
  season_winner_user_id: string | null;
  season_winner_courses: number | null;
  prize_claimed: boolean;
  winner_display_name?: string | null;
  winner_avatar_url?: string | null;
  winner_club_name?: string | null;
}

export function useSeasonCalendar() {
  return useQuery({
    queryKey: ['season-calendar'],
    queryFn: async () => {
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_season_calendar');
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData as Season[];
      }
      
      // Fallback: query championship_seasons directly
      const now = new Date().toISOString();
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('championship_seasons' as any)
        .select('id, season_number, name, tagline, description, icon, color, status, start_date, end_date, sponsor_name, prize_description, season_winner_user_id, season_winner_courses, prize_claimed')
        .order('start_date', { ascending: true });
      
      if (fallbackError || !fallbackData) {
        throw rpcError || fallbackError || new Error('Failed to fetch seasons');
      }
      
      // Transform to expected format
      return (fallbackData as any[]).map(s => {
        const startDate = new Date(s.start_date);
        const endDate = new Date(s.end_date);
        const nowDate = new Date();
        const isCurrent = nowDate >= startDate && nowDate <= endDate;
        const daysRemaining = isCurrent 
          ? Math.ceil((endDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const daysUntilStart = nowDate < startDate
          ? Math.ceil((startDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        return {
          season_id: s.id,
          season_number: s.season_number,
          name: s.name,
          tagline: s.tagline,
          description: s.description,
          icon: s.icon,
          color: s.color,
          status: s.status,
          start_date: s.start_date,
          end_date: s.end_date,
          duration_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          is_current: isCurrent,
          days_remaining: daysRemaining,
          days_until_start: daysUntilStart,
          sponsor_name: s.sponsor_name ?? null,
          prize_description: s.prize_description ?? null,
        } as Season;
      });
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
