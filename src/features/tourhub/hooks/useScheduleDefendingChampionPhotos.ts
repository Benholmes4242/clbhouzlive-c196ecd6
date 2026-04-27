/**
 * useScheduleDefendingChampionPhotos
 *
 * Fetches defending-champion player photos for Schedule page upcoming rows.
 * Lifted from the proven useHeroCarouselData.ts pattern (single batched
 * `or()` query against sr_players using lowercased first/last name match).
 *
 * Inputs an array of upcoming tournaments (only those that pass the
 * Phase 2 show-the-section threshold) and returns a Map keyed by
 * tournament.id → { name, photoUrl }.
 *
 * Photos are best-effort — name mismatches gracefully return `photoUrl: null`
 * so the row still renders the defending champion's name.
 *
 * Cache: 30 minutes — defending champions don't change between page loads.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourTournament } from './useTourHubData';

export interface DefendingChampionEntry {
  name: string;
  photoUrl: string | null;
}

export type DefendingChampionMap = Map<string, DefendingChampionEntry>;

interface ScheduleTournamentLike {
  id: string;
  defending_champion?: string | null;
}

/**
 * Builds the Map without fetching — used as the synchronous fallback when
 * the query is empty or loading. Ensures the row always has the name.
 */
function buildNameOnlyMap(
  tournaments: ScheduleTournamentLike[],
): DefendingChampionMap {
  const map: DefendingChampionMap = new Map();
  tournaments.forEach((t) => {
    if (t.defending_champion) {
      map.set(t.id, { name: t.defending_champion, photoUrl: null });
    }
  });
  return map;
}

export function useScheduleDefendingChampionPhotos(
  tournaments: ScheduleTournamentLike[] | undefined | null,
) {
  // Stable cache key from the sorted unique list of names actually being looked up
  const champNames = (tournaments ?? [])
    .map((t) => t.defending_champion)
    .filter((n): n is string => !!n);
  const uniqueNames = Array.from(new Set(champNames)).sort();

  return useQuery<DefendingChampionMap>({
    queryKey: ['schedule', 'defending-champions', uniqueNames],
    queryFn: async () => {
      if (!tournaments || tournaments.length === 0 || uniqueNames.length === 0) {
        return buildNameOnlyMap(tournaments ?? []);
      }

      // Build batched or() expression matching first+last name (ilike, case-insensitive)
      const orExpr = uniqueNames
        .map((name) => {
          const parts = name.trim().split(/\s+/);
          const first = parts[0]?.replace(/[(),]/g, '') ?? '';
          const last = parts.slice(1).join(' ').replace(/[(),]/g, '');
          if (!first || !last) return null;
          return `and(first_name.ilike.${first},last_name.ilike.${last})`;
        })
        .filter((s): s is string => !!s)
        .join(',');

      let photoByLowerName = new Map<string, string | null>();

      if (orExpr) {
        const { data, error } = await supabase
          .from('sr_players')
          .select('first_name, last_name, photo_url')
          .or(orExpr);

        if (error) {
          console.warn('[useScheduleDefendingChampionPhotos] Lookup failed:', error.message);
        } else {
          (data ?? []).forEach((p: any) => {
            const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim().toLowerCase();
            if (fullName) photoByLowerName.set(fullName, p.photo_url ?? null);
          });
        }
      }

      const map: DefendingChampionMap = new Map();
      tournaments.forEach((t) => {
        if (!t.defending_champion) return;
        const lookup = t.defending_champion.toLowerCase();
        map.set(t.id, {
          name: t.defending_champion,
          photoUrl: photoByLowerName.get(lookup) ?? null,
        });
      });
      return map;
    },
    enabled: Array.isArray(tournaments),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/** Re-export the input shape so consumers can narrow as needed. */
export type { TourTournament };
