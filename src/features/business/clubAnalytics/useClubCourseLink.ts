/**
 * BRIEF_CLUB_ANALYTICS_TAB §2 — ELIGIBILITY, and the course the tab is about.
 *
 * THE TAB RENDERS ONLY WHEN ALL THREE HOLD:
 *   a. category is 'Golf Club'
 *   b. the business is VERIFIED
 *   c. the claim resolves to a COURSE
 *
 * THE COURSE LINK ALREADY EXISTS — no new association is built here and the
 * club is never asked to pick its own course from a list. Resolution order:
 *   1. business_claimed_courses.course_id  (the approved link; authoritative)
 *   2. course_claim_requests.source_course_id on an approved claim — this is
 *      the field BusinessProfileEditor writes when the claim originated from a
 *      course page, and in practice it is the ONLY one of club_id / club_key /
 *      source_course_id that resolves to a golf_courses ROW: club_id resolves
 *      to a CLUB and club_key is a slug of one.
 *   3. the claim's club_id, and ONLY when that club owns exactly one course.
 *
 * §2.1 MULTI-COURSE CLUBS ARE NOT EDGE. A stroke index belongs to a COURSE,
 * not a club, so when the claim resolves to a club with more than one course
 * and no specific course, this hook returns `ambiguous` and the tab REPORTS AND
 * STOPS. It never merges two courses' holes into one ranking — that would
 * produce a verdict for a course that does not exist.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClubCourseLink =
  | { state: 'not_a_club' }
  | { state: 'unverified' }
  | { state: 'unclaimed' }
  | { state: 'ambiguous'; clubName: string | null; courses: { id: string; name: string }[] }
  | {
      state: 'resolved';
      courseId: string;
      courseName: string;
      source: 'claimed_course' | 'source_course_id' | 'sole_club_course';
    };

interface Input {
  businessId: string | undefined;
  category: string | null | undefined;
  isVerified: boolean | undefined;
  clubId: string | null | undefined;
}

export const CLUB_ANALYTICS_CATEGORY = 'Golf Club';

/** Cheap, synchronous pre-check — used to decide whether to show the entry
 *  point at all. It cannot know about (c), so the page carries the full test. */
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

      // 1. the approved link
      const { data: claimed } = await supabase
        .from('business_claimed_courses')
        .select('course_id')
        .eq('business_id', businessId!)
        .limit(2);

      const claimedIds = (claimed ?? []).map((r) => r.course_id).filter(Boolean) as string[];
      if (claimedIds.length === 1) {
        const name = await courseName(claimedIds[0]);
        if (name) return { state: 'resolved', courseId: claimedIds[0], courseName: name, source: 'claimed_course' };
      }
      if (claimedIds.length > 1) {
        const courses = await courseRows(claimedIds);
        return { state: 'ambiguous', clubName: null, courses };
      }

      // 2. the claim's source course
      const { data: claims } = await supabase
        .from('course_claim_requests')
        .select('club_id, source_course_id, status, created_at')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false });

      const approved = (claims ?? []).find((c) => c.status === 'approved') ?? (claims ?? [])[0] ?? null;
      if (approved?.source_course_id) {
        const name = await courseName(approved.source_course_id);
        if (name) {
          return {
            state: 'resolved',
            courseId: approved.source_course_id,
            courseName: name,
            source: 'source_course_id',
          };
        }
      }

      // 3. the club — only when it owns exactly one course
      const club = approved?.club_id ?? clubId ?? null;
      if (!club) return { state: 'unclaimed' };

      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name')
        .eq('club_id', club)
        .order('name');

      const rows = (courses ?? []) as { id: string; name: string }[];
      if (rows.length === 1) {
        return { state: 'resolved', courseId: rows[0].id, courseName: rows[0].name, source: 'sole_club_course' };
      }
      if (rows.length > 1) {
        const { data: clubRow } = await supabase
          .from('golf_clubs')
          .select('name')
          .eq('id', club)
          .maybeSingle();
        return { state: 'ambiguous', clubName: clubRow?.name ?? null, courses: rows };
      }
      return { state: 'unclaimed' };
    },
  });
}

async function courseName(id: string): Promise<string | null> {
  const { data } = await supabase.from('golf_courses').select('name').eq('id', id).maybeSingle();
  return data?.name ?? null;
}

async function courseRows(ids: string[]): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase.from('golf_courses').select('id, name').in('id', ids).order('name');
  return (data ?? []) as { id: string; name: string }[];
}
