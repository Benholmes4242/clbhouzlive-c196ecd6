import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GolfClub {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  sub_country: string | null;
  continent: string | null;
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
          .select('id, name, country, region, sub_country, continent')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(limit);

        if (clubsError) throw clubsError;

        // Also search aliases and get their canonical clubs
        const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
        const { data: aliasMatches, error: aliasError } = await supabase
          .from('golf_club_aliases')
          .select('canonical_club_id')
          .ilike('alias_key', `%${normalizedQuery}%`)
          .limit(limit);

        if (aliasError) throw aliasError;

        // Get canonical clubs from aliases
        let aliasClubs: GolfClub[] = [];
        if (aliasMatches && aliasMatches.length > 0) {
          const aliasClubIds = aliasMatches.map(a => a.canonical_club_id);
          const { data: aliasClubData, error: aliasClubError } = await supabase
            .from('golf_clubs')
            .select('id, name, country, region, sub_country, continent')
            .in('id', aliasClubIds);

          if (aliasClubError) throw aliasClubError;
          aliasClubs = aliasClubData || [];
        }

        // Merge and dedupe results (direct matches take priority)
        const clubIds = new Set(clubs?.map(c => c.id) || []);
        const mergedClubs = [...(clubs || [])];
        
        for (const aliasClub of aliasClubs) {
          if (!clubIds.has(aliasClub.id)) {
            mergedClubs.push(aliasClub);
            clubIds.add(aliasClub.id);
          }
        }

        // Sort alphabetically and limit
        mergedClubs.sort((a, b) => a.name.localeCompare(b.name));
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
