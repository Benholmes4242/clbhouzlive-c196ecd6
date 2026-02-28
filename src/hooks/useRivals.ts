import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Rival {
  id: string;
  rival_user_id: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
  xp_data?: {
    total_xp: number;
    rank: number;
  };
  comparison?: {
    xp_difference: number;
    rank_difference: number;
    is_ahead: boolean;
  };
}

export function useRivals(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rivals', userId],
    queryFn: async (): Promise<Rival[]> => {
      if (!userId) return [];

      // Get rivals with profile data
      const { data: rivals, error } = await supabase
        .from('rivals')
        .select(`
          *,
          profile:user_profiles!rivals_rival_user_id_fkey(
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Get current season
      const now = new Date().toISOString();
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .lte('starts_at', now)
        .gte('ends_at', now)
        .single();

      if (!season) return rivals as Rival[];

      // Get XP data for all users (user + rivals)
      const allUserIds = [userId, ...rivals.map(r => r.rival_user_id)];
      const { data: xpData } = await supabase
        .from('user_season_xp' as any)
        .select('user_id, total_xp')
        .eq('season_id', season.id)
        .in('user_id', allUserIds) as { data: Array<{ user_id: string; total_xp: number }> | null };

      const userXP = xpData?.find((x: any) => x.user_id === userId)?.total_xp || 0;

      // Add comparison data
      return rivals.map(rival => {
        const rivalXP = xpData?.find((x: any) => x.user_id === rival.rival_user_id)?.total_xp || 0;
        const xpDifference = userXP - rivalXP;

        return {
          ...rival,
          xp_data: {
            total_xp: rivalXP,
            rank: 0, // TODO: Calculate actual rank
          },
          comparison: {
            xp_difference: Math.abs(xpDifference),
            rank_difference: 0, // TODO: Calculate rank difference
            is_ahead: xpDifference > 0,
          },
        };
      }) as Rival[];
    },
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
  });

  const addRival = useMutation({
    mutationFn: async (rivalUserId: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Check if already a rival
      const { data: existing } = await supabase
        .from('rivals')
        .select('id')
        .eq('user_id', userId)
        .eq('rival_user_id', rivalUserId)
        .maybeSingle();

      if (existing) {
        throw new Error('Already added as rival');
      }

      // Check rival limit (max 5)
      const { count } = await supabase
        .from('rivals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= 5) {
        throw new Error('Maximum 5 rivals allowed');
      }

      const { data, error } = await supabase
        .from('rivals')
        .insert({
          user_id: userId,
          rival_user_id: rivalUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivals', userId] });
      toast.success('Rival added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add rival');
    },
  });

  const removeRival = useMutation({
    mutationFn: async (rivalId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('rivals')
        .delete()
        .eq('id', rivalId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivals', userId] });
      toast.success('Rival removed');
    },
    onError: () => {
      toast.error("Couldn't remove rival");
    },
  });

  return {
    rivals: query.data || [],
    isLoading: query.isLoading,
    addRival: addRival.mutate,
    removeRival: removeRival.mutate,
    isAddingRival: addRival.isPending,
    isRemovingRival: removeRival.isPending,
  };
}
