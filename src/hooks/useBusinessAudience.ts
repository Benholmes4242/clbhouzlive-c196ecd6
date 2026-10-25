/**
 * CB84 — Insights section 3 "Your golfers".
 *
 * Reads `get_business_audience` (hand-applied INSIGHTS_AUDIENCE_V1, not yet in
 * generated types). The server owns EVERY privacy rule: bands arrive merged so
 * each has 5 or more, regions under 5 are already inside `elsewhere`, and
 * nothing is returned below 10 golfers with a handicap. The client renders
 * exactly what it gets — it never re-derives, re-splits or re-merges — and the
 * read does not depend on the 7/30/90 picker.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AudienceBand { from: number; to: number; count: number }
export interface AudienceRegion { region: string; count: number }
export interface BusinessAudience {
  followers_total: number;
  with_handicap: number;
  state: 'none' | 'not_enough' | 'ready';
  median: number | null;
  bands: AudienceBand[];
  regions: AudienceRegion[];
  elsewhere: number | null;
}

const num = (v: unknown) => Number(v) || 0;

export function parseAudience(raw: any): BusinessAudience {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  return {
    followers_total: num(p.followers_total),
    with_handicap: num(p.with_handicap),
    state: p.state === 'ready' || p.state === 'not_enough' ? p.state : 'none',
    median: p.median == null ? null : num(p.median),
    bands: Array.isArray(p.bands)
      ? p.bands.map((b: any) => ({ from: num(b?.from), to: num(b?.to), count: num(b?.count) }))
      : [],
    regions: Array.isArray(p.regions)
      ? p.regions.map((r: any) => ({ region: String(r?.region ?? ''), count: num(r?.count) }))
      : [],
    elsewhere: p.elsewhere == null ? null : num(p.elsewhere),
  };
}

const BAND_LOWER = ['Plus', '6', '13', '21'];
const BAND_UPPER = ['5', '12', '20', 'up'];

/** Names one server-merged band. The server can join neighbours, so any
 *  {from, to} pair is possible; the client only names it, never reshapes it. */
export function bandLabel(from: number, to: number): string {
  if (from === 0 && to === 3) return 'All handicaps';
  if (to === 3) return `${BAND_LOWER[from]} and up`;
  if (from === 0) return `Plus to ${BAND_UPPER[to]}`;
  return `${BAND_LOWER[from]} to ${BAND_UPPER[to]}`;
}

/** The title's band: the largest group; on a tie, the lower band. Bands
 *  arrive in order, so the first maximum wins. */
export function largestBand(bands: AudienceBand[]): AudienceBand | null {
  let best: AudienceBand | null = null;
  for (const b of bands) if (!best || b.count > best.count) best = b;
  return best;
}

/** One decimal. A plus handicap is stored NEGATIVE (golf convention — the
 *  profile prints the raw figure, so a stored -1.2 is a +1.2) and shows "+"
 *  with the absolute value. */
export function formatMedian(median: number): string {
  return median < 0 ? `+${Math.abs(median).toFixed(1)}` : median.toFixed(1);
}

export function useBusinessAudience(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-audience', businessId],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BusinessAudience> => {
      const { data, error } = await (supabase.rpc as any)('get_business_audience', {
        p_business_id: businessId,
      });
      if (error) throw error;
      return parseAudience(data);
    },
  });
}
