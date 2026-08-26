import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_CLAIM_AWARE_VERIFY_CARD §1 — reads the business's most recent COURSE
 * CLAIM row.
 *
 * A course claim ("this business runs this course") is a DIFFERENT record from a
 * verification request ("this business is who it says it is"). This hook exists
 * only so the manage card can acknowledge a claim that is already in flight; it
 * must never be used to derive verification state.
 *
 * Measured 26 Aug 2026: no business holds more than one claim row (a partial
 * unique index blocks a second active claim per club, and request_course_claim
 * refuses when one is in flight), so "most recent" is also "the only one" today.
 */
export interface BusinessCourseClaim {
  id: string;
  status: 'pending' | 'needs_more_info' | 'approved' | 'rejected' | 'cancelled' | string;
  createdAt: string;
  /** Course name when the claim carries a source course, else the club name. */
  courseName: string | null;
}

export function useBusinessCourseClaim(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-course-claim', businessId],
    enabled: !!businessId,
    staleTime: 60_000,
    queryFn: async (): Promise<BusinessCourseClaim | null> => {
      if (!businessId) return null;

      const { data, error } = await supabase
        .from('course_claim_requests')
        .select('id, status, created_at, source_course_id, club_id')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      let courseName: string | null = null;

      if (data.source_course_id) {
        const { data: course } = await supabase
          .from('golf_courses')
          .select('name')
          .eq('id', data.source_course_id)
          .maybeSingle();
        courseName = course?.name ?? null;
      }

      if (!courseName && data.club_id) {
        const { data: club } = await supabase
          .from('golf_clubs')
          .select('name')
          .eq('id', data.club_id)
          .maybeSingle();
        courseName = club?.name ?? null;
      }

      return {
        id: data.id,
        status: data.status,
        createdAt: data.created_at,
        courseName,
      };
    },
  });
}
