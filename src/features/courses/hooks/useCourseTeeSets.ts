// Phase L3 - course tee sets.
// Fetches real tee sets (Red / Yellow / White etc) reconstructed nightly from
// members' WHS rounds. Returns [] when no rounds have been synced for the
// course; the consuming component MUST render null in that case.
//
// ASCII only - no em dashes in comments (house rule per Phase L2).

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TeeLabelKind = 'colour' | 'special';
export type TeeGenderScope = 'ladies' | 'mens' | 'unisex' | 'unknown';

export interface TeeHole {
  hole_no: number;
  par: number;
  /** null when the catalogue carries no stroke index for the hole. */
  si: number | null;
  /** null when the catalogue carries no yardage for the hole. */
  yards: number | null;
}

export interface TeeSet {
  tee_label: string;
  label_kind: TeeLabelKind;
  gender_scope: TeeGenderScope;
  course_rating: number;
  slope_rating: number;
  par_total: number;
  total_yards: number | null;
  holes: TeeHole[];
  rounds_sampled: number;
  last_played_at: string | null;
}

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function coerce(raw: any): TeeSet[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    tee_label: String(r?.tee_label ?? ''),
    label_kind: (r?.label_kind === 'special' ? 'special' : 'colour') as TeeLabelKind,
    gender_scope: (['ladies', 'mens', 'unisex', 'unknown'].includes(r?.gender_scope)
      ? r.gender_scope
      : 'unknown') as TeeGenderScope,
    // PostgREST returns numeric as string - coerce to Number per brief.
    course_rating: Number(r?.course_rating ?? 0),
    slope_rating: Number(r?.slope_rating ?? 0),
    par_total: Number(r?.par_total ?? 0),
    total_yards: r?.total_yards == null ? null : Number(r.total_yards),
    holes: Array.isArray(r?.holes)
      ? r.holes.map((h: any) => ({
          hole_no: Number(h?.hole_no ?? 0),
          par: Number(h?.par ?? 0),
          si: Number(h?.si ?? 0),
          yards: Number(h?.yards ?? 0),
        }))
      : [],
    rounds_sampled: Number(r?.rounds_sampled ?? 0),
    last_played_at: r?.last_played_at ?? null,
  }));
}

export function useCourseTeeSets(courseId: string | undefined) {
  return useQuery<TeeSet[]>({
    queryKey: ['course-tee-sets', courseId],
    enabled: !!courseId,
    staleTime: TWELVE_HOURS,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_tee_sets', {
        p_golf_course_id: courseId,
      });
      if (error) throw error;
      return coerce(data);
    },
  });
}
