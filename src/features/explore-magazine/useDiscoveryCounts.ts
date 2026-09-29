import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * REGION AND NATION COUNTS (BRIEF_COURSES_GEOGRAPHY). One call to
 * public.get_course_geography feeds both blocks. SECURITY INVOKER, so
 * `active` is the viewer's own view — never present it as a global figure.
 *
 * "ACTIVE" = a course carrying a round or a rating — never the catalogue total.
 * `catalogue` is kept for the see-all destination only.
 */
export interface RegionActivityRow {
  region: string;
  parent: string | null;
  /** Active courses the viewer has not played. */
  toDiscover: number;
  /** Active courses the viewer has played. */
  played: number;
  /** Active courses in the region. */
  active: number;
  catalogue: number;
  imageUrl: string | null;
}

export interface NationActivityRow {
  nation: string;
  /** Active courses. Zero renders greyed "Nothing yet" and is not a link. */
  active: number;
  catalogue: number;
}

interface GeoRow {
  level: string;
  name: string;
  parent: string | null;
  catalogue: number | null;
  active: number | null;
  you_played: number | null;
  thumb: string | null;
}

export function useCourseGeography(viewerId: string | null | undefined, enabled: boolean) {
  const q = useQuery({
    queryKey: ['course-geography', viewerId],
    enabled: !!viewerId && enabled,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      // Function is not in the generated types; call untyped.
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: GeoRow[] | null; error: unknown }>)('get_course_geography', { p_viewer: viewerId });
      if (error) throw error;
      const rows = data ?? [];
      const byActive = <T extends { active: number }>(a: T, b: T) => b.active - a.active;
      const nations: NationActivityRow[] = rows
        .filter((r) => r.level === 'nation')
        .map((r) => ({ nation: r.name, active: r.active ?? 0, catalogue: r.catalogue ?? 0 }))
        .sort(byActive);
      const regions: RegionActivityRow[] = rows
        .filter((r) => r.level === 'region')
        .map((r) => {
          const active = r.active ?? 0;
          const played = r.you_played ?? 0;
          return {
            region: r.name,
            parent: r.parent,
            active,
            played,
            toDiscover: Math.max(0, active - played),
            catalogue: r.catalogue ?? 0,
            imageUrl: r.thumb,
          };
        })
        .sort(byActive);
      return { nations, regions };
    },
  });
  // Nothing until settled; failure renders nothing (§4).
  const ok = q.isSuccess ? q.data : null;
  return {
    regions: ok ? ok.regions.slice(0, 4) : null,
    nations: ok ? ok.nations : null,
  };
}
