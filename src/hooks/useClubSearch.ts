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
        const { data: clubs, error: clubsError } = await supabase
          .from('golf_clubs')
          .select('id, name, country, region, sub_country, continent')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(limit);

        if (clubsError) throw clubsError;

        setData(clubs || []);
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
