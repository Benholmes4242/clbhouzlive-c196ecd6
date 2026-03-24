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

      // Country rank — p_scope='country' + p_country filter
      if (country) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_championship_leaderboard' as any, {
                p_scope: 'country',
                p_limit: 1000,
                p_offset: 0,
                p_country: String(country),
              });
            if (!error && Array.isArray(data)) {
              result.countryTotal = data.length;
              const idx = data.findIndex((e: any) => e.user_id === userId);
              result.countryRank = idx >= 0 ? idx + 1 : null;
            }
          })()
        );
      }

      // Club rank — p_scope='club' + p_club_id filter (uuid param)
      if (clubId) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_championship_leaderboard' as any, {
                p_scope: 'club',
                p_limit: 1000,
                p_offset: 0,
                p_club_id: clubId, // uuid type — pass directly, no String() cast
              });
            if (!error && Array.isArray(data)) {
              result.clubTotal = data.length;
              const idx = data.findIndex((e: any) => e.user_id === userId);
              result.clubRank = idx >= 0 ? idx + 1 : null;
            }
          })()
        );
      }

      // Handicap rank — get_lowest_handicap_leaderboard returns eg_handicap_index.
      // Client-side band filter: ±1.5 strokes around user's handicap.
      // get_championship_leaderboard does not return handicap_index so we use the
      // handicap-specific RPC instead.
      if (handicapIndex !== null) {
        promises.push(
          (async () => {
            const { data, error } = await supabase
              .rpc('get_lowest_handicap_leaderboard' as any, {
                p_scope: 'global',
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
