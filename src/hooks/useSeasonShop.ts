import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopItem {
  id: string;
  season_id: string;
  name: string;
  description: string | null;
  category: 'profile_ring' | 'post_frame' | 'reaction_pack' | 'title' | 'theme' | 'badge_variant';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_url: string | null;
  preview_url: string | null;
  cost: number;
  is_premium_only: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const rarityOrder = {
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

export function useSeasonShop(seasonId?: string) {
  return useQuery({
    queryKey: ['season-shop', seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<ShopItem[]> => {
      if (!seasonId) return [];

      const { data, error } = await supabase
        .from('season_shop_items')
        .select('id, season_id, name, description, category, rarity, icon_url, preview_url, cost, is_premium_only, is_active, sort_order, created_at')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Sort by rarity first, then by sort_order
      const sorted = (data || []).sort((a, b) => {
        const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        return a.sort_order - b.sort_order;
      });

      return sorted as ShopItem[];
    },
    staleTime: 60_000,
  });
}
