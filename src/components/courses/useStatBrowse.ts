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

/** The four boards exposed by the rebuilt Courses browse rail. */
export const COURSE_BROWSE_LENSES = ['rated', 'played', 'toughest', 'scoreable'] as const;

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
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  difficulty_percentile: number | null;
  memberships: Array<{ list_slug: string; rank: number }>;
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
  /** Distinct mapped course ids in every round state; not browse eligibility. */
  all_played_total: number;
  /** Distinct courses carrying an aggregate community rating. */
  rated_total: number;
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
    design_score: null,
    condition_score: null,
    clubhouse_score: null,
    facilities_score: null,
    difficulty_percentile: null,
    memberships: [],
  };
}

/**
 * COUNT CONTRACT — these are deliberately different populations.
 * ratedTotal: courses carrying a non-mock aggregate community rating.
 * allPlayedTotal: distinct mapped course ids appearing in gam_round_stats,
 * regardless of score/par/hole completeness.
 * stat_browse_facets.played_total: analytics-ready 18-hole scored courses only.
 */
export function useCourseBrowseTruth() {
  return useQuery({
    queryKey: ['course-browse-truth'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [facetsResult, difficultyResult] = await Promise.all([
        supabase.rpc('get_stat_browse_facets' as never),
        supabase.from('stat_browse_base' as never).select('course_id, avg_to_par').not('avg_to_par', 'is', null).range(0, 9999),
      ]);
      if (facetsResult.error) throw facetsResult.error;
      if (difficultyResult.error) throw difficultyResult.error;

      const facetData = (facetsResult.data ?? {}) as Record<string, unknown>;
      const allPlayedTotal = Number(facetData.all_played_total ?? 0);
      const ratedTotal = Number(facetData.rated_total ?? 0);
      const difficultyRows = (difficultyResult.data ?? []) as unknown as Array<{
        course_id: string;
        avg_to_par: number | string;
      }>;
      const sorted = difficultyRows
        .map((row) => Number(row.avg_to_par))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      const difficultyPercentiles = new Map<string, number>();
      difficultyRows.forEach((row) => {
        const value = Number(row.avg_to_par);
        if (!Number.isFinite(value) || sorted.length === 0) return;
        const easier = sorted.filter((candidate) => candidate < value).length;
        difficultyPercentiles.set(row.course_id, Math.round((easier / sorted.length) * 100));
      });
      return { allPlayedTotal, ratedTotal, difficultyPercentiles };
    },
  });
}

/**
 * DRIFT TRAP — per-lens eligibility now lives in TWO server functions:
 * as CASE arms inside get_stat_browse_courses (which rows a lens returns) and
 * as FILTER clauses inside get_stat_browse_facets (the lens_counts consumed
 * below, which decides whether a lens is offered at all). If one changes
 * without the other, the dropdown promises rows the list cannot deliver, or
 * greys out a lens that works. Change them together. Do NOT re-derive
 * eligibility here to "check" the server — that would make three copies.
 */
function normaliseLensCounts(raw: unknown): LensCounts | null {
  // Absent on payloads cached before lens_counts shipped. Returning null means
  // "unknown", and every consumer must FAIL OPEN (all lenses available): a
  // lens shown as empty is recoverable, a working lens greyed out is not.
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const out = {} as LensCounts;
  for (const l of STAT_LENSES) out[l] = Number(r[l] ?? 0);
  return out;
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
        countries: ((d.countries as Record<string, unknown>[]) ?? []).map((c) => ({
          country: String(c.country ?? ''),
          sub_country: String(c.sub_country),
          courses: Number(c.courses),
          directory_total: Number(c.directory_total),
          lens_counts: normaliseLensCounts(c.lens_counts),
        })),
        regions: ((d.regions as Record<string, unknown>[]) ?? []).map((r) => ({
          sub_country: String(r.sub_country),
          region: String(r.region),
          courses: Number(r.courses),
          lens_counts: normaliseLensCounts(r.lens_counts),
        })),
        played_total: Number(d.played_total ?? 0),
        all_played_total: Number(d.all_played_total ?? 0),
        rated_total: Number(d.rated_total ?? 0),
        directory_total: Number(d.directory_total ?? 0),
        lens_counts_all: normaliseLensCounts(d.lens_counts_all),
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
        const baseRows = ((data ?? []) as Record<string, unknown>[]).map(normaliseRow);
        const ids = baseRows.map((row) => row.course_id);
        const [ratingsResult, membershipsResult] = ids.length
          ? await Promise.all([
              supabase
                .from('course_rating_aggregates')
                .select('course_id, avg_design_score, avg_condition_score, avg_clubhouse_score, avg_facilities_score')
                .in('course_id', ids),
              supabase
                .from('course_top100_memberships')
                .select('course_id, rank, top100_lists!inner(slug, is_active)')
                .in('course_id', ids),
            ])
          : [{ data: [], error: null }, { data: [], error: null }];
        if (ratingsResult.error) throw ratingsResult.error;
        if (membershipsResult.error) throw membershipsResult.error;

        const ratingByCourse = new Map(
          ((ratingsResult.data ?? []) as Array<Record<string, unknown>>).map((rating) => [
            String(rating.course_id),
            rating,
          ]),
        );
        const membershipsByCourse = new Map<string, Array<{ list_slug: string; rank: number }>>();
        ((membershipsResult.data ?? []) as unknown as Array<{
          course_id: string;
          rank: number;
          top100_lists: { slug?: string; is_active?: boolean } | Array<{ slug?: string; is_active?: boolean }> | null;
        }>).forEach((membership) => {
          const list = Array.isArray(membership.top100_lists)
            ? membership.top100_lists[0]
            : membership.top100_lists;
          const slug = list?.slug;
          if (!slug || list?.is_active === false) return;
          const current = membershipsByCourse.get(membership.course_id) ?? [];
          current.push({ list_slug: slug, rank: Number(membership.rank) });
          membershipsByCourse.set(membership.course_id, current);
        });
        const next = baseRows.map((row) => {
          const rating = ratingByCourse.get(row.course_id);
          return {
            ...row,
            design_score: num(rating?.avg_design_score),
            condition_score: num(rating?.avg_condition_score),
            clubhouse_score: num(rating?.avg_clubhouse_score),
            facilities_score: num(rating?.avg_facilities_score),
            memberships: membershipsByCourse.get(row.course_id) ?? [],
          };
        });
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
