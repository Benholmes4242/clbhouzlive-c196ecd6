import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseHole, CourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { MIN_ROUNDS } from '@/components/courses/course-detail/about/HowItPlays';

// Ordered by rounds with hole detail, descending — NOT by Top 100 rank. Do not reorder.
const CONNECT_INTRO_FALLBACK_COURSE_IDS = [
  '27cbd5a0-9b27-44f6-9ea0-d1130a0e3ebe', // Parkstone Golf Club — rank 82, 22 rounds with hole detail
  'b66b9793-7896-4208-bce8-c2dcd2b1f2e3', // Hankley Common Golf Club — rank 47, 20 rounds with hole detail
] as const;

const NAME_SUFFIXES = [' golf club', ' golf links', ' golf course', ' golf centre', ' golf resort'];

/** Removes at most ONE trailing club suffix, only if at least three characters remain. */
export function stripClubSuffix(name: string): string {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const suffix of NAME_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      const rest = trimmed.slice(0, trimmed.length - suffix.length).trim();
      return rest.length >= 3 ? rest : trimmed;
    }
  }
  return trimmed;
}

export interface ConnectIntroCourse {
  source: 'home' | 'top100';
  courseId: string;
  courseName: string;
  holes: CourseHole[];
  totalRounds: number;
}

/** Never throws: an unavailable or empty analysis simply does not qualify. */
async function analyse(courseId: string): Promise<{ holes: CourseHole[]; totalRounds: number } | null> {
  try {
    const { data, error } = await (supabase.rpc as any)('get_course_hole_analysis', { p_course_id: courseId });
    if (error || !data) return null;
    const a = data as CourseHoleAnalysis;
    const holes = [...(a.holes ?? [])].sort((x, y) => x.hole_no - y.hole_no);
    const totalRounds = Number(a.total_rounds ?? 0);
    if (totalRounds < MIN_ROUNDS || holes.length === 0) return null;
    return { holes, totalRounds };
  } catch {
    return null;
  }
}

export function useConnectIntroCourse(clubId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['connect-intro-course', enabled ? clubId : 'disabled'],
    staleTime: 5 * 60_000,
    enabled,
    queryFn: async (): Promise<ConnectIntroCourse | null> => {
      if (clubId) {
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, name')
          .eq('club_id', clubId)
          .limit(6);
        const results = await Promise.all(
          (courses ?? []).map(async (c: { id: string; name: string }) => ({ c, r: await analyse(c.id) })),
        );
        const best = results
          .filter((x) => x.r != null)
          .sort((a, b) => b.r!.totalRounds - a.r!.totalRounds)[0];
        if (best) return { source: 'home', courseId: best.c.id, courseName: best.c.name, ...best.r! };
      }
      for (const id of CONNECT_INTRO_FALLBACK_COURSE_IDS) {
        const r = await analyse(id);
        if (!r) continue;
        const { data: course } = await supabase.from('golf_courses').select('name').eq('id', id).maybeSingle();
        if (!course?.name) continue;
        return { source: 'top100', courseId: id, courseName: course.name, ...r };
      }
      return null;
    },
  });
}
