import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useCourseTop100Standing — the course's Top 100 standing read from
 * course_top100_memberships, the ONE source of truth for list ranks.
 *
 * WHY THIS EXISTS: golf_courses.global_rank / regional_rank / usa_rank are
 * legacy denormalised copies with no writer, so nothing keeps them in step with
 * the lists and nothing would correct them. They also disagree in MEANING —
 * regional_rank on a US course holds that course's USA rank. Ruled: the hero
 * badge reads the lists. The columns stay in the table but are no longer read.
 *
 * Anonymous-safe on purpose: course_top100_memberships and top100_lists both
 * carry public read policies, so a signed-out visitor sees the same badge.
 * (get_top100_course_insights cannot be used here — it requires a session.)
 */
export type CourseTop100Standing = {
  globalRank: number | null;
  /** GB&I or Continental Europe, whichever regional list the course sits on. */
  regionalRank: number | null;
  usaRank: number | null;
};

const EMPTY: CourseTop100Standing = { globalRank: null, regionalRank: null, usaRank: null };

export function useCourseTop100Standing(courseId?: string | null) {
  return useQuery({
    queryKey: ['course-top100-standing', courseId ?? 'none'],
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<CourseTop100Standing> => {
      if (!courseId) return EMPTY;
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('rank, top100_lists!inner(slug, is_active)')
        .eq('course_id', courseId);
      if (error) throw error;

      const out: CourseTop100Standing = { ...EMPTY };
      for (const row of (data ?? []) as Array<{
        rank: number | null;
        top100_lists: { slug: string; is_active: boolean } | null;
      }>) {
        const list = row.top100_lists;
        if (!list || list.is_active === false || row.rank == null) continue;
        if (list.slug === 'global') out.globalRank = row.rank;
        else if (list.slug === 'usa') out.usaRank = row.rank;
        else if (list.slug === 'gb-i' || list.slug === 'europe') out.regionalRank = row.rank;
      }
      return out;
    },
  });
}
