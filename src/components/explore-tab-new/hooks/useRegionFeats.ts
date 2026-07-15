import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeatTier = 'legendary' | 'eagles' | 'birdie_hauls' | 'records';

export interface FeatRow {
  course_name: string;
  course_image: string | null;
  holder_name: string | null;
  holder_username?: string | null;
  holder_avatar: string | null;
  holder_hcp?: number | null;
  holder_club?: string | null;
  feat_type?: string;
  feat_value?: string;
  play_date?: string;
  score_id?: string;
  user_id?: string;
  course_id?: string;
  // records-only
  category?: string;
  value?: number | string;
  attained_at?: string;
  thumbnail_image?: string | null;
  course_par?: number | null;
}

const CACHE_REGION: Record<string, string> = {
  usa: 'usa',
  'uk-ireland': 'gbi',
  'continental-europe': 'europe',
  'rest-of-world': 'row',
};

export function toCacheRegion(r: string | null): string {
  return r ? CACHE_REGION[r] ?? 'worldwide' : 'worldwide';
}

export type RecordsMode = 'latest' | 'alltime';

export function rowToPar(row: FeatRow): number | null {
  if (row.category === 'best_stableford_all_time') return null;
  const n =
    typeof row.value === 'number'
      ? row.value
      : typeof row.value === 'string' && row.value.trim() !== '' && !isNaN(Number(row.value))
        ? Number(row.value)
        : null;
  if (n == null || row.course_par == null) return null;
  return n - row.course_par;
}

export function toParText(d: number): string {
  if (d === 0) return 'E';
  return d < 0 ? String(d) : `+${d}`;
}

export function sortRecordsAllTime(rows: FeatRow[]): FeatRow[] {
  const stroke: FeatRow[] = [];
  const noPar: FeatRow[] = [];
  const stableford: FeatRow[] = [];
  for (const r of rows) {
    if (r.category === 'best_stableford_all_time') stableford.push(r);
    else if (rowToPar(r) == null) noPar.push(r);
    else stroke.push(r);
  }
  stroke.sort((a, b) => {
    const da = rowToPar(a)!;
    const db = rowToPar(b)!;
    if (da !== db) return da - db;
    const ga = Number(a.value);
    const gb = Number(b.value);
    if (ga !== gb) return ga - gb;
    const ta = a.attained_at ? Date.parse(a.attained_at) : Infinity;
    const tb = b.attained_at ? Date.parse(b.attained_at) : Infinity;
    return ta - tb;
  });
  noPar.sort((a, b) => Number(a.value) - Number(b.value));
  return [...stroke, ...noPar, ...stableford];
}

// Shared birdie-haul sort. alltime: haul count desc, tiebreak earliest date
// ASC (first to the haul keeps precedence, matching the records convention).
// latest: date desc.
export function sortBirdieHauls(rows: FeatRow[], mode: RecordsMode): FeatRow[] {
  const parseCount = (r: FeatRow): number =>
    parseFloat(String(r.feat_value ?? r.value ?? '').replace(/[^\d.]/g, '')) || 0;
  const dateOf = (r: FeatRow): string => r.play_date ?? r.attained_at ?? '';
  const out = [...rows];
  if (mode === 'alltime') {
    out.sort((a, b) => {
      const bv = parseCount(b);
      const av = parseCount(a);
      if (bv !== av) return bv - av;
      // earliest first on tie
      const ad = dateOf(a);
      const bd = dateOf(b);
      return ad.localeCompare(bd);
    });
  } else {
    out.sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  }
  return out;
}

export function useRegionFeats(
  region: string | null,
  tier: FeatTier,
  mode: RecordsMode = 'latest',
) {
  const cacheRegion = toCacheRegion(region);
  const isAllTime = mode === 'alltime';
  const railKey =
    tier === 'records'
      ? isAllTime
        ? `records_alltime:${cacheRegion}`
        : `records:${cacheRegion}`
      : tier === 'birdie_hauls' && isAllTime
        ? `feats_alltime:${cacheRegion}:birdie_hauls`
        : `feats:${cacheRegion}:${tier}`;


  return useQuery<FeatRow[]>({
    queryKey: ['discover-rail-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as FeatRow[];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Legendary leaders (aces & albatrosses all-time)
// ─────────────────────────────────────────────────────────────────────────────

export interface LegendaryLeaderRow {
  user_id: string | null;
  holder_name: string | null;
  holder_avatar: string | null;
  holder_hcp?: number | null;
  holder_club?: string | null;
  first_feat?: string | null;
  aces: number;
  albatrosses: number;
}

export function useRegionLegendaryLeaders(region: string | null) {
  const cacheRegion = toCacheRegion(region);
  const railKey = `legendary_leaders:${cacheRegion}`;
  return useQuery<LegendaryLeaderRow[]>({
    queryKey: ['discover-rail-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as LegendaryLeaderRow[];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Eagle leaders (all-time eagle counts by holder)
// ─────────────────────────────────────────────────────────────────────────────

export interface EagleLeaderRow {
  user_id: string | null;
  holder_name: string | null;
  holder_avatar: string | null;
  holder_hcp?: number | null;
  holder_club?: string | null;
  first_feat?: string | null;
  eagles: number;
}

export function useRegionEagleLeaders(region: string | null) {
  const cacheRegion = toCacheRegion(region);
  const railKey = `eagle_leaders:${cacheRegion}`;
  return useQuery<EagleLeaderRow[]>({
    queryKey: ['discover-rail-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as EagleLeaderRow[];
    },
  });
}


