/**
 * BRIEF_CLUB_ANALYTICS_MULTI_COURSE §3 — THE GATE, AND NOTHING ELSE.
 *
 * THE TAB RENDERS ONLY WHEN ALL THREE HOLD:
 *   a. category is 'Golf Club'
 *   b. the business is VERIFIED
 *   c. the club owns at least one course
 *
 * THE COURSE-PICKING HALF OF THIS HOOK IS GONE. There is no 'resolved' state,
 * no 'ambiguous' state, and none of the three lookups that existed only to
 * choose ONE course (business_claimed_courses, course_claim_requests
 * .source_course_id, the sole-club-course query). The RPC returns `club_courses`
 * — every course the club owns — and the page renders one block per course, so
 * choosing was the bug: Sundridge Park owns two courses and the old page could
 * only ever reach East.
 *
 * All this hook still needs is SOME course id to make the FIRST call with. It
 * takes the club's first course by name; the RPC then hands back the full list.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClubCourseLink =
  | { state: 'not_a_club' }
  | { state: 'unverified' }
  | { state: 'unclaimed' }
  /** A course id to open the first RPC with. `club_courses` supersedes it. */
  | { state: 'seed'; courseId: string; courseName: string };

interface Input {
  businessId: string | undefined;
  category: string | null | undefined;
  isVerified: boolean | undefined;
  clubId: string | null | undefined;
}

export const CLUB_ANALYTICS_CATEGORY = 'Golf Club';

/** Cheap, synchronous pre-check — used to decide whether to show the entry
 *  point at all. It cannot know about (c), so the page carries the full test.
 *  UNTOUCHED: BusinessCommandCard imports this. */
export function mayHaveClubAnalytics(
  category: string | null | undefined,
  isVerified: boolean | undefined,
  clubId: string | null | undefined,
): boolean {
  return category === CLUB_ANALYTICS_CATEGORY && !!isVerified && !!clubId;
}

export function useClubCourseLink({ businessId, category, isVerified, clubId }: Input) {
  return useQuery<ClubCourseLink>({
    queryKey: ['club-course-link', businessId, category, isVerified, clubId],
    enabled: !!businessId && category != null && isVerified != null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (category !== CLUB_ANALYTICS_CATEGORY) return { state: 'not_a_club' };
      if (!isVerified) return { state: 'unverified' };
      if (!clubId) return { state: 'unclaimed' };

      const { data } = await supabase
        .from('golf_courses')
        .select('id, name')
        .eq('club_id', clubId)
        .order('name')
        .limit(1);

      const first = (data ?? [])[0] as { id: string; name: string } | undefined;
      if (!first) return { state: 'unclaimed' };
      return { state: 'seed', courseId: first.id, courseName: first.name };
    },
  });
}
