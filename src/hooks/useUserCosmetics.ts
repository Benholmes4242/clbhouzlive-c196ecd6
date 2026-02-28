import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ShopItem } from './useSeasonShop';

export interface UserCosmeticUnlock {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
  item?: ShopItem;
}

export function useUserCosmetics(userId?: string) {
  const queryClient = useQueryClient();

  const { data: unlocks, isLoading } = useQuery({
    queryKey: ['user-cosmetics', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserCosmeticUnlock[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_cosmetic_unlocks')
        .select(`
          id, user_id, item_id, unlocked_at,
          item:season_shop_items(id, season_id, name, description, category, rarity, icon_url, preview_url, cost, is_premium_only, sort_order)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data as unknown as UserCosmeticUnlock[];
    },
    staleTime: 60_000,
  });

  const { data: currency } = useQuery({
    queryKey: ['user-season-currency', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_season_currency')
        .select('user_id, balance, lifetime_earned, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const unlockMutation = useMutation({
    mutationFn: async ({ itemId, cost }: { itemId: string; cost: number }) => {
      if (!userId) throw new Error('User ID required');

      // Check if user has enough currency
      if (!currency || currency.balance < cost) {
        throw new Error('Insufficient currency');
      }

      // Deduct currency
      const { error: currencyError } = await supabase
        .from('user_season_currency')
        .update({
          balance: currency.balance - cost,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (currencyError) throw currencyError;

      // Unlock item
      const { error: unlockError } = await supabase
        .from('user_cosmetic_unlocks')
        .insert({
          user_id: userId,
          item_id: itemId,
        });

      if (unlockError) throw unlockError;

      return { itemId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cosmetics', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-season-currency', userId] });
      
      toast.success('Item unlocked');
    },
    onError: (error: Error) => {
      toast.error("Couldn't unlock item", {
        description: error.message,
      });
    },
  });

  return {
    unlocks: unlocks || [],
    currency: currency?.balance || 0,
    lifetimeEarned: currency?.lifetime_earned || 0,
    isLoading,
    unlockItem: unlockMutation.mutate,
    isUnlocking: unlockMutation.isPending,
  };
}