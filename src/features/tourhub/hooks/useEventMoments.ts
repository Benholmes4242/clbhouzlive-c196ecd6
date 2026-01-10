import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MomentType = 'winner' | 'ace' | 'albatross' | 'record' | 'comeback' | 'playoff' | 'eagle' | 'highlight' | 'milestone' | 'streak';

export interface EventMoment {
  id: string;
  tournament_id: string;
  player_id: string | null;
  moment_type: MomentType;
  headline: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  // Joined data
  player?: {
    id: string;
    full_name: string;
    country: string | null;
  };
}

/**
 * Fetch moments for a tournament
 */
export function useEventMoments(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'event-moments', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('event_moments')
        .select(`
          *,
          player:sr_players(id, full_name, country)
        `)
        .eq('tournament_id', tournamentId)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching event moments:', error);
        return [];
      }
      return (data || []) as EventMoment[];
    },
    enabled: !!tournamentId,
    staleTime: 10 * 60 * 1000,
  });
}

// Icon and color config for moment types
export const MOMENT_TYPE_CONFIG: Record<MomentType, { icon: string; color: string; label: string }> = {
  winner: { icon: '🏆', color: 'bg-amber-500/15 text-amber-600', label: 'Champion' },
  ace: { icon: '🎯', color: 'bg-amber-500/15 text-amber-600', label: 'Hole-in-One' },
  albatross: { icon: '🦅', color: 'bg-purple-500/15 text-purple-600', label: 'Albatross' },
  eagle: { icon: '🦅', color: 'bg-emerald-500/15 text-emerald-600', label: 'Eagle' },
  record: { icon: '📊', color: 'bg-blue-500/15 text-blue-600', label: 'Course Record' },
  comeback: { icon: '🔥', color: 'bg-orange-500/15 text-orange-600', label: 'Comeback' },
  playoff: { icon: '⚔️', color: 'bg-red-500/15 text-red-600', label: 'Playoff' },
  milestone: { icon: '⭐', color: 'bg-indigo-500/15 text-indigo-600', label: 'Milestone' },
  streak: { icon: '🔥', color: 'bg-orange-500/15 text-orange-600', label: 'Streak' },
  highlight: { icon: '✨', color: 'bg-slate-500/15 text-slate-600', label: 'Highlight' },
};
