import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ShopItem } from './useSeasonShop';

export interface CosmeticLoadout {
  user_id: string;
  equipped_profile_ring: string | null;
  equipped_post_frame: string | null;
  equipped_reaction_pack: string | null;
  equipped_title: string | null;
  equipped_theme: string | null;
  updated_at: string;
}

export interface LoadoutWithItems extends CosmeticLoadout {
  profile_ring?: ShopItem;
  post_frame?: ShopItem;
  reaction_pack?: ShopItem;
  title?: ShopItem;
  theme?: ShopItem;
}

export function useLoadout(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loadout, isLoading } = useQuery({
    queryKey: ['cosmetic-loadout', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LoadoutWithItems | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('cosmetic_loadouts')
        .select(`
          *,
          profile_ring:equipped_profile_ring(*)
 ,
          post_frame:equipped_post_frame(*),
          reaction_pack:equipped_reaction_pack(*),
          title:equipped_title(*),
          theme:equipped_theme(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
      return data as unknown as LoadoutWithItems | null;
    },
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<CosmeticLoadout, 'user_id' | 'updated_at'>>) => {
      if (!userId) throw new Error('User ID required');

      const { error } = await supabase
        .from('cosmetic_loadouts')
        .upsert({
          user_id: userId,
          ...updates,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmetic-loadout', userId] });
      
      toast({
        title: 'Loadout Updated!',
        description: 'Your cosmetic changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    loadout: loadout || null,
    isLoading,
    setLoadout: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
