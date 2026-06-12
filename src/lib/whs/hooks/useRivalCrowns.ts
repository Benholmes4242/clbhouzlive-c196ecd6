import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { emptyCrowns, type RivalCrowns } from
  '@/components/profile/handicap/whs/sections/rivalries/_shared/headlineEngine';

const FIVE_MIN = 5 * 60 * 1000;

export function useRivalCrowns(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['whs-rival-crowns', userId],
    enabled: !!userId,
    staleTime: FIVE_MIN,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, RivalCrowns>> => {
      const { data, error } = await supabase.rpc('get_rival_crowns' as any, {
        p_user_id: userId,
      });
      if (error) throw error;
      const rows = (data as any[]) ?? [];
      const map = new Map<string, RivalCrowns>();
      for (const r of rows) {
        if (!r?.rival_key) continue;
        map.set(r.rival_key, {
          rival_key: r.rival_key,
          lowest_gross_you:  r.lowest_gross_you  ?? null,
          lowest_gross_them: r.lowest_gross_them ?? null,
          birdies_you:  r.birdies_you  ?? 0,
          birdies_them: r.birdies_them ?? 0,
          eagles_you:   r.eagles_you   ?? 0,
          eagles_them:  r.eagles_them  ?? 0,
          aces_you:     r.aces_you     ?? 0,
          aces_them:    r.aces_them    ?? 0,
        });
      }
      return map;
    },
  });
}

export function useRivalCrownsForOwner(ownerUserId: string | null | undefined) {
  return useQuery({
    queryKey: ['whs-rival-crowns-for-owner', ownerUserId],
    enabled: !!ownerUserId,
    staleTime: FIVE_MIN,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, RivalCrowns>> => {
      const { data, error } = await supabase.rpc('get_rival_crowns_for_owner' as any, {
        p_owner_id: ownerUserId,
      });
      if (error) throw error;
      const rows = (data as any[]) ?? [];
      const map = new Map<string, RivalCrowns>();
      for (const r of rows) {
        if (!r?.rival_key) continue;
        map.set(r.rival_key, {
          rival_key: r.rival_key,
          lowest_gross_you:  r.lowest_gross_you  ?? null,
          lowest_gross_them: r.lowest_gross_them ?? null,
          birdies_you:  r.birdies_you  ?? 0,
          birdies_them: r.birdies_them ?? 0,
          eagles_you:   r.eagles_you   ?? 0,
          eagles_them:  r.eagles_them  ?? 0,
          aces_you:     r.aces_you     ?? 0,
          aces_them:    r.aces_them    ?? 0,
        });
      }
      return map;
    },
  });
}

export { emptyCrowns };
export type { RivalCrowns };
