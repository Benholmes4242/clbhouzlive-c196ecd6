import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WrapCard {
  type: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export interface SeasonWrap {
  id: string;
  user_id: string;
  season_id: string;
  cards: WrapCard[];
  viewed: boolean;
  generated_at: string;
  seasonName?: string;
}

export function useSeasonWrap(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['season-wrap', userId],
    queryFn: async (): Promise<SeasonWrap | null> => {
      if (!userId) return null;

      // Get the most recently ended season
      const now = new Date().toISOString();
      const { data: endedSeasons } = await supabase
        .from('seasons')
        .select('*')
        .lt('ends_at', now)
        .order('ends_at', { ascending: false })
        .limit(1);

      if (!endedSeasons || endedSeasons.length === 0) return null;

      const lastSeason = endedSeasons[0];

      // Get wrap cards for this season
      const { data: wrap, error } = await supabase
        .from('season_wrap_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', lastSeason.id)
        .eq('viewed', false)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!wrap) return null;

      return {
        ...wrap,
        cards: typeof wrap.cards === 'string' ? JSON.parse(wrap.cards) : wrap.cards,
        seasonName: lastSeason.name,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const markAsViewed = useMutation({
    mutationFn: async (wrapId: string) => {
      const { error } = await supabase
        .from('season_wrap_cards')
        .update({ viewed: true })
        .eq('id', wrapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-wrap', userId] });
    },
  });

  return {
    wrap: query.data,
    isLoading: query.isLoading,
    hasUnviewedWrap: !!query.data && !query.data.viewed,
    markAsViewed: markAsViewed.mutate,
    isMarkingViewed: markAsViewed.isPending,
  };
}
