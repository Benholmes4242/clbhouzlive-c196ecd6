import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export interface HomeClubHit {
  id: string;
  name: string;
  /**
   * NOTE: golf_clubs.country is a CONTINENT-LEVEL BUCKET ("USA",
   * "Britain & Ireland", "Continental Europe"). It is never presented as a
   * country and never offered as a filter — see BRIEF_HOME_CLUB_PICKER §1.2.
   */
  country: string | null;
  region: string | null;
  sub_country: string | null;
  member_count: number;
}

/**
 * Search-only club lookup over the existing `search_golf_clubs` RPC.
 * The RPC does not return sub_country, so a second lookup fills it in for the
 * returned ids — region + sub_country are what disambiguate 23,090 clubs.
 */
export function useHomeClubSearch(query: string, limit = 12) {
  const [data, setData] = useState<HomeClubHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data: hits, error: rpcError } = await supabase.rpc('search_golf_clubs', {
          p_query: q,
          p_limit: limit,
        });
        if (rpcError) throw rpcError;

        const rows = (hits ?? []) as Array<{
          id: string; name: string; country: string | null; region: string | null; member_count: number | null;
        }>;

        let subs = new Map<string, string | null>();
        if (rows.length) {
          const { data: clubs } = await supabase
            .from('golf_clubs')
            .select('id, sub_country')
            .in('id', rows.map(r => r.id));
          subs = new Map((clubs ?? []).map((c: { id: string; sub_country: string | null }) => [c.id, c.sub_country]));
        }

        if (cancelled) return;
        setData(rows.map(r => ({
          id: r.id,
          name: r.name,
          country: r.country,
          region: r.region,
          sub_country: subs.get(r.id) ?? null,
          member_count: Number(r.member_count ?? 0),
        })));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        AppLog.error('[useHomeClubSearch]', 'club search failed', e);
        setError('Search failed. Try again.');
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, limit]);

  return { data, loading, error };
}
