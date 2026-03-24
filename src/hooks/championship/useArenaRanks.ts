import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ArenaRanks {
  countryRank: number | null;
  countryTotal: number;
  clubRank: number | null;
  clubTotal: number;
  handicapRank: number | null;
  handicapTotal: number;
}

/**
 * useArenaRanks — Fetches the user's rank in country, club, and handicap arenas.
 * Global rank comes from the main leaderboard entry, so not duplicated here.
 */
export function useArenaRanks(
  userId: string | undefined,
  country: string | null,
  clubId: string | null,
  handicapIndex: number | null,
) {
  return useQuery<ArenaRanks>({
    queryKey: ['arena-ranks', userId, country, clubId, handicapIndex],
    enabled: !!userId,
    staleTime: 5 * 60_000, // 5 minutes
    queryFn: async (): Promise<ArenaRanks> => {
      const result: ArenaRanks = {
        countryRank: null,
        countryTotal: 0,
        clubRank: null,
        clubTotal: 0,
        handicapRank: null,
        handicapTotal: 0,
      };

      // Run all queries in parallel
      const promises: Promise<void>[] = [];

      // Country rank
      if (country) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_championship_leaderboard' as any, {
                p_time_filter: 'seasonal',
                p_limit: 1000,
                p_offset: 0,
                p_country: country,
              });
            if (!error && Array.isArray(data)) {
              result.countryTotal = data.length;
              const idx = data.findIndex((e: any) => e.user_id === userId);
              result.countryRank = idx >= 0 ? idx + 1 : null;
            }
          })()
        );
      }

      // Club rank
      if (clubId) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_championship_leaderboard' as any, {
                p_time_filter: 'seasonal',
                p_limit: 1000,
                p_offset: 0,
                p_club_id: clubId,
              });
            if (!error && Array.isArray(data)) {
              result.clubTotal = data.length;
              const idx = data.findIndex((e: any) => e.user_id === userId);
              result.clubRank = idx >= 0 ? idx + 1 : null;
            }
          })()
        );
      }

      // Handicap rank — client-side filter from global leaderboard
      if (handicapIndex !== null) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_championship_leaderboard' as any, {
                p_time_filter: 'seasonal',
                p_limit: 1000,
                p_offset: 0,
              });
            if (!error && Array.isArray(data)) {
              const band = data.filter((e: any) => {
                const hi = e.handicap_index;
                return hi !== null && hi !== undefined &&
                  hi >= handicapIndex - 1.5 && hi <= handicapIndex + 1.5;
              });
              result.handicapTotal = band.length;
              const idx = band.findIndex((e: any) => e.user_id === userId);
              result.handicapRank = idx >= 0 ? idx + 1 : null;
            }
          })()
        );
      }

      await Promise.all(promises);
      return result;
    },
  });
}
