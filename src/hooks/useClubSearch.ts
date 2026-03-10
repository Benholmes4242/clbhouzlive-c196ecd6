import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export interface GolfClub {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  sub_country: string | null;
  continent: string | null;
  club_key: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface UseClubSearchOptions {
  debounceMs?: number;
  limit?: number;
}

/**
 * Search for golf clubs (parent entities that can have multiple courses).
 * Used for home club selection to avoid duplicate course variants (East/West, Old/New).
 * Also searches aliases table for typo/spelling corrections.
 */
export function useClubSearch(query: string, options: UseClubSearchOptions = {}) {
  const { debounceMs = 250, limit = 10 } = options;
  const [data, setData] = useState<GolfClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // Search clubs directly by name
        const { data: clubs, error: clubsError } = await supabase
          .from('golf_clubs')
          .select('id, name, country, region, sub_country, continent, club_key, latitude, longitude')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(limit);

        if (clubsError) throw clubsError;

        // Search aliases only if query is long enough (reduces noise)
        const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
        let aliasClubs: GolfClub[] = [];
        
        if (normalizedQuery.length >= 4) {
          // Use prefix match for better precision
          const { data: aliasMatches, error: aliasError } = await supabase
            .from('golf_club_aliases')
            .select('canonical_club_id')
            .ilike('alias_key', `${normalizedQuery}%`)
            .limit(limit);

          if (aliasError) throw aliasError;

          // Get canonical clubs from aliases
          if (aliasMatches && aliasMatches.length > 0) {
            const aliasClubIds = aliasMatches.map(a => a.canonical_club_id);
            const { data: aliasClubData, error: aliasClubError } = await supabase
              .from('golf_clubs')
              .select('id, name, country, region, sub_country, continent, club_key, latitude, longitude')
              .in('id', aliasClubIds);

            if (aliasClubError) throw aliasClubError;
            aliasClubs = aliasClubData || [];
          }
        }

        // Merge results: direct matches first (sorted), then alias results (sorted)
        const directMatches = (clubs || []).sort((a, b) => a.name.localeCompare(b.name));
        const clubIds = new Set(directMatches.map(c => c.id));
        
        // Add alias clubs that aren't already in direct matches
        const uniqueAliasClubs = aliasClubs
          .filter(c => !clubIds.has(c.id))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        const mergedClubs = [...directMatches, ...uniqueAliasClubs];

        // Limit results (already sorted: direct first, then alias)
        setData(mergedClubs.slice(0, limit));
      } catch (err) {
        console.error('Error searching clubs:', err);
        setError('Failed to search clubs');
        setData([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, limit]);

  return { data, loading, error };
}
