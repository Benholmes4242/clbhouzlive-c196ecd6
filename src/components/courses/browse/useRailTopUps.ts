/**
 * Rail top-up reads (BRIEF_WHATS_BEEN_PLAYED §4): a rail with fewer than three
 * played courses is topped up from get_stat_browse_courses p_lens 'rated'.
 * p_country matches golf_courses.sub_country (StatBrowse passes the nation
 * from facets.countries[].sub_country), so a nation rail passes its nation, the
 * Ireland rail reads both nations and merges by rating, and Abroad reads
 * unscoped, keeping rows outside the home grouping. Each candidate's photo
 * count is warmed into useCourseMediaCounts' shared cache so the card settles
 * with the section.
 */
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseMediaCountsKey, fetchCourseMediaCounts } from '@/hooks/useCourseMediaCounts';
import { RAIL_MIN, type RailPlan, type RatedCandidate } from './playedRings';
import { settled } from './PageLoadGate';

export interface RatedCourse extends RatedCandidate { name: string; region: string | null; imageUrl: string | null }
const NATION_LIMIT = 20;
const ABROAD_LIMIT = 100;
const TOP_UP_COUNT_LIMIT = RAIL_MIN;

async function readRated(country: string | null, limit: number): Promise<RatedCourse[]> {
  const { data, error } = await supabase.rpc('get_stat_browse_courses' as never, {
    p_lens: 'rated', p_country: country, p_region: null, p_limit: limit, p_offset: 0,
  } as never);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    courseId: String(r.course_id),
    name: String(r.name ?? ''),
    region: (r.region as string) || null,
    imageUrl: (r.image_url as string) || null,
    rating: r.community_rating == null ? null : Number(r.community_rating),
    country: (r.country as string) || null,
    subCountry: (r.sub_country as string) || null,
  }));
}

export function useRailTopUps(rails: RailPlan[], grouping: string, userId: string | undefined) {
  const cache = useQueryClient();
  const needing = rails.filter((r) => r.courseIds.length < RAIL_MIN);
  const reads = useQueries({
    queries: needing.map((rail) => ({
      queryKey: ['courses', 'rail-top-up', rail.key, rail.kind === 'abroad' ? grouping : rail.nations.join('|'), userId ?? null],
      staleTime: 5 * 60_000,
      queryFn: async (): Promise<RatedCourse[]> => {
        let rows: RatedCourse[];
        if (rail.kind === 'abroad') rows = (await readRated(null, ABROAD_LIMIT)).filter((r) => r.country !== grouping);
        else rows = (await Promise.all(rail.nations.map((n) => readRated(n, NATION_LIMIT)))).flat();
        rows = rows.filter((r) => r.rating != null).sort((a, b) => (b.rating as number) - (a.rating as number));
        // Warm the shared photo counts for the cards the rail can show.
        await Promise.all(rows.slice(0, TOP_UP_COUNT_LIMIT + rails.length).map((r) =>
          cache.fetchQuery({ queryKey: courseMediaCountsKey(r.courseId, userId), staleTime: 2 * 60_000, queryFn: () => fetchCourseMediaCounts(r.courseId, userId) }).catch(() => null)));
        return rows;
      },
    })),
  });
  const byRail = new Map<string, RatedCourse[]>();
  needing.forEach((rail, i) => byRail.set(rail.key, reads[i]?.data ?? []));
  return { byRail, ready: reads.every((q) => settled(q)) };
}
