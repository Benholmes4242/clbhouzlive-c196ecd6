import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiscoverCourseRow {
  course_id: string;
  course_name: string;
  course_region: string | null;
  course_country: string | null;
  course_type: string | null;
  course_header_image?: string | null;
  recent_legend_count?: number | null;
}

async function hydrateHeaderImages<T extends { course_name: string; course_header_image?: string | null }>(
  rows: T[],
): Promise<T[]> {
  if (rows.length === 0) return rows;
  const { lookupCourseMetaV2 } = await import('@/lib/whs/courseNameMatcher');
  const byNameLower = new Map<string, string>();
  for (const r of rows) {
    const k = r.course_name.toLowerCase();
    if (!byNameLower.has(k)) byNameLower.set(k, r.course_name);
  }
  const imageByName: Record<string, string | null> = {};
  await Promise.all(
    Array.from(byNameLower.entries()).map(async ([k, original]) => {
      try {
        const meta = await lookupCourseMetaV2(original);
        imageByName[k] = meta?.thumbnail_image ?? null;
      } catch {
        imageByName[k] = null;
      }
    }),
  );
  return rows.map((r) => ({
    ...r,
    course_header_image: r.course_header_image ?? imageByName[r.course_name.toLowerCase()] ?? null,
  }));
}

/**
 * Backed by the future RPC `get_discover_courses_this_week`. Returns empty on
 * RPC error so the UI renders the empty stub.
 */
export function useDiscoverCoursesThisWeek() {
  return useQuery({
    queryKey: ['gam', 'discover-courses-this-week'],
    staleTime: 60_000,
    queryFn: async (): Promise<DiscoverCourseRow[]> => {
      const { data, error } = await (supabase.rpc as any)('get_discover_courses_this_week', { p_limit: 24 });
      if (error) return [];
      const rows = (data ?? []) as DiscoverCourseRow[];
      return hydrateHeaderImages(rows);
    },
  });
}

export { hydrateHeaderImages as __hydrateHeaderImages };
