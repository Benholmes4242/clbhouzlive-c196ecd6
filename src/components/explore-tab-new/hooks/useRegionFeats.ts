import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slugToCacheRegion } from '../regionScope';

/**
 * `bogey_free` and `under_par` are the round-level tiers added for
 * BRIEF_ATW_MASONRY (as corrected). Each kind has its OWN tier and rail —
 * `feats:<region>:bogey_free`, `feats:<region>:under_par`. There is no
 * `scoring` tier and no Stableford tier.
 * `eagles` is RETAINED — see the report; it still has a reader.
 */
export type FeatTier =
  | 'legendary'
  | 'eagles'
  | 'birdie_hauls'
  | 'records'
  | 'bogey_free'
  | 'under_par';

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
  // legendary rows only: hole context joined at cache-build time
  hole_no?: number | null;
  hole_par?: number | null;
  hole_yards?: number | null;
  score_id?: string;

  user_id?: string;
  course_id?: string;
  // per-item region key used by cached rails ('gbi' | 'usa' | 'europe' | 'row')
  region?: string | null;
  // records-only
  category?: string;
  value?: number | string;
  attained_at?: string;
  thumbnail_image?: string | null;
  course_par?: number | null;
  // records-only feat stats, joined at cache-build time (may be absent)
  birdies?: number | null;
  eagles?: number | null;
  albatrosses?: number | null;
  holes_in_one?: number | null;
  beat_par?: boolean | null;
  clean_card?: boolean | null;
  /**
   * Server-supplied benchmark for the feat ("Previous best 4", "First round
   * here"). Person-neutral and length-budgeted by refresh_discover_feats;
   * rendered VERBATIM. Null on aces and albatrosses — deliberately, since a
   * hole in one has no previous best.
   */
  feat_margin?: string | null;
}

// Rails are bucketed server-side into per-region cache rows. The client
// picks the correct row via `slugToCacheRegion` (see regionScope.ts) — no
// per-item client-side filtering.

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

export interface RegionFeatsOptions {
  /**
   * Discover's wire is a news surface: returning to it after five minutes
   * should show what has happened since. A deliberate exception to the
   * app-wide `refetchOnWindowFocus: false` in App.tsx, set per query.
   */
  refetchOnWindowFocus?: boolean;
  /**
   * Per-call freshness threshold. The DEFAULT matches the real cadence of the
   * source: `refresh_discover_feats` rebuilds `discover_rail_cache` every TEN
   * MINUTES, so a shorter threshold buys identical data twice.
   *
   * Callers whose rail changes on a different clock pass their own — the
   * honours board (`legendary`) is all-time and takes an hour. Every rail has
   * its OWN query key (`tier` is part of it), so a per-call value genuinely
   * separates them rather than fighting a shared cache entry.
   *
   * NOTHING HERE POLLS. This governs refetching only when something asks:
   * mount, or focus where `refetchOnWindowFocus` is set.
   */
  staleTime?: number;
}

/** The rail-cache rebuild interval. */
export const RAIL_CACHE_STALE_MS = 10 * 60 * 1000;

/** All-time records change a few times a year, not every ten minutes. */
export const ALLTIME_RAIL_STALE_MS = 60 * 60 * 1000;

export function useRegionFeats(
  region: string | null,
  tier: FeatTier,
  mode: RecordsMode = 'latest',
  options: RegionFeatsOptions = {},
) {
  const cacheRegion = slugToCacheRegion(region);
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
    queryKey: ['discover-rail-cache', tier, cacheRegion, mode, railKey],
    staleTime: options.staleTime ?? RAIL_CACHE_STALE_MS,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
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
  region?: string | null;
  aces: number;
  albatrosses: number;
}

export function useRegionLegendaryLeaders(region: string | null) {
  const cacheRegion = slugToCacheRegion(region);
  const railKey = `legendary_leaders:${cacheRegion}`;
  return useQuery<LegendaryLeaderRow[]>({
    queryKey: ['discover-rail-cache', 'legendary_leaders', cacheRegion, railKey],
    // All-time aces and albatrosses.
    staleTime: ALLTIME_RAIL_STALE_MS,
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
  region?: string | null;
  eagles: number;
}

export function useRegionEagleLeaders(region: string | null) {
  const cacheRegion = slugToCacheRegion(region);
  const railKey = `eagle_leaders:${cacheRegion}`;
  return useQuery<EagleLeaderRow[]>({
    queryKey: ['discover-rail-cache', 'eagle_leaders', cacheRegion, railKey],
    // All-time eagle counts.
    staleTime: ALLTIME_RAIL_STALE_MS,
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


