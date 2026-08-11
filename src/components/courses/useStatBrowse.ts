/**
 * useStatBrowse — data layer for the Courses explore stat browse.
 *
 * Reads two RPCs only (delivered separately):
 *   get_stat_browse_courses(p_lens, p_country, p_region, p_limit, p_offset)
 *   get_stat_browse_facets()
 *
 * Rows arrive already ordered for the active lens. Nothing is sorted,
 * averaged or ranked here — the hook only coerces PostgREST strings to
 * numbers, accumulates pages, and derives the per-lens chip / sample line.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const STAT_BROWSE_PAGE_SIZE = 10;

export const STAT_LENSES = [
  'toughest',
  'scoreable',
  'played',
  'longest',
  'rated',
  'chase',
] as const;

export type StatLens = (typeof STAT_LENSES)[number];

export function isStatLens(v: string | null | undefined): v is StatLens {
  return !!v && (STAT_LENSES as readonly string[]).includes(v);
}

export interface StatBrowseRow {
  course_id: string;
  name: string;
  region: string | null;
  sub_country: string | null;
  country: string;
  image_url: string | null;
  community_rating: number | null;
  review_count: number;
  global_rank: number | null;
  regional_rank: number | null;
  rounds: number;
  members: number;
  avg_to_par: number | null;
  total_yards: number | null;
  tee_label: string | null;
  course_record: number | null;
  open_crowns: number;
  total_count: number;
}

/** Qualifying-course count per lens for one scope. */
export type LensCounts = Record<StatLens, number>;

export interface StatBrowseFacets {
  countries: Array<{
    /** Macro-region (golf_courses.country). '' when a cached payload predates it. */
    country: string;
    sub_country: string;
    courses: number;
    directory_total: number;
    /** null when a cached payload predates lens_counts — treat as all available. */
    lens_counts: LensCounts | null;
  }>;
  regions: Array<{
    sub_country: string;
    region: string;
    courses: number;
    lens_counts: LensCounts | null;
  }>;
  played_total: number;
  directory_total: number;
  lens_counts_all: LensCounts | null;
}


const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

function normaliseRow(raw: Record<string, unknown>): StatBrowseRow {
  return {
    course_id: String(raw.course_id),
    name: String(raw.name ?? ''),
    region: (raw.region as string) ?? null,
    sub_country: (raw.sub_country as string) ?? null,
    country: String(raw.country ?? ''),
    image_url: (raw.image_url as string) ?? null,
    community_rating: num(raw.community_rating),
    review_count: num(raw.review_count) ?? 0,
    global_rank: num(raw.global_rank),
    regional_rank: num(raw.regional_rank),
    rounds: num(raw.rounds) ?? 0,
    members: num(raw.members) ?? 0,
    avg_to_par: num(raw.avg_to_par),
    total_yards: num(raw.total_yards),
    tee_label: (raw.tee_label as string) ?? null,
    course_record: num(raw.course_record),
    open_crowns: num(raw.open_crowns) ?? 0,
    total_count: num(raw.total_count) ?? 0,
  };
}

/** Facet vocabulary — fetched once per mount, cached for the session. */
export function useStatBrowseFacets() {
  return useQuery<StatBrowseFacets>({
    queryKey: ['stat-browse-facets'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stat_browse_facets' as never);
      if (error) throw error;
      const d = (data ?? {}) as Record<string, unknown>;
      return {
        countries: ((d.countries as StatBrowseFacets['countries']) ?? []).map((c) => ({
          country: String(c.country ?? ''),
          sub_country: c.sub_country,
          courses: Number(c.courses),
          directory_total: Number(c.directory_total),
        })),
        regions: ((d.regions as StatBrowseFacets['regions']) ?? []).map((r) => ({
          sub_country: r.sub_country,
          region: r.region,
          courses: Number(r.courses),
        })),
        played_total: Number(d.played_total ?? 0),
        directory_total: Number(d.directory_total ?? 0),
      };
    },
  });
}

interface UseStatBrowseListArgs {
  lens: StatLens;
  country: string | null;
  region: string | null;
}

/**
 * Paged list for the active lens + filters. Pages append; a filter change
 * resets to offset 0.
 */
export function useStatBrowseList({ lens, country, region }: UseStatBrowseListArgs) {
  const [rows, setRows] = useState<StatBrowseRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (offset: number) => {
      const id = ++requestId.current;
      if (offset === 0) setIsLoading(true);
      else setIsPaging(true);
      const { data, error: rpcError } = await supabase.rpc('get_stat_browse_courses' as never, {
        p_lens: lens,
        p_country: country,
        p_region: region,
        p_limit: STAT_BROWSE_PAGE_SIZE,
        p_offset: offset,
      } as never);
      if (id !== requestId.current) return;
      if (rpcError) {
        setError(rpcError.message);
        if (offset === 0) setRows([]);
      } else {
        const next = ((data ?? []) as Record<string, unknown>[]).map(normaliseRow);
        setError(null);
        setTotalCount(next[0]?.total_count ?? (offset === 0 ? 0 : totalCount));
        setRows((prev) => (offset === 0 ? next : [...prev, ...next]));
      }
      setIsLoading(false);
      setIsPaging(false);
    },
    [lens, country, region, totalCount],
  );

  useEffect(() => {
    void fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lens, country, region]);

  const loadMore = useCallback(() => {
    if (isPaging || rows.length >= totalCount) return;
    void fetchPage(rows.length);
  }, [fetchPage, isPaging, rows.length, totalCount]);

  return { rows, totalCount, isLoading, isPaging, error, loadMore };
}

/* ── Per-lens presentation derivations ──────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-GB');

export function chipForLens(
  lens: StatLens,
  row: StatBrowseRow,
  unitLabel: (key: string) => string,
): { value: string; unit: string } | null {
  switch (lens) {
    case 'toughest':
    case 'scoreable': {
      if (row.avg_to_par == null) return null;
      const v = Math.round(row.avg_to_par * 10) / 10;
      const value = v > 0 ? `+${v.toFixed(1)}` : v < 0 ? `-${Math.abs(v).toFixed(1)}` : 'E';
      return { value, unit: unitLabel('avgToPar') };
    }
    case 'played':
      return row.rounds == null ? null : { value: fmt(row.rounds), unit: unitLabel('rounds') };
    case 'longest':
      return row.total_yards == null
        ? null
        : { value: fmt(row.total_yards), unit: unitLabel('yards') };
    case 'rated':
      return row.community_rating == null
        ? null
        : { value: row.community_rating.toFixed(1), unit: unitLabel('outOfTen') };
    case 'chase':
      return row.open_crowns == null
        ? null
        : { value: String(row.open_crowns), unit: unitLabel('crownsOpen') };
    default:
      return null;
  }
}
