import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClaimingBusiness {
  id: string;
  name: string;
  slug: string | null;
  is_verified: boolean | null;
  logo_url: string | null;
}

export type CourseClaimState = 'unclaimed' | 'pending' | 'claimed';

export interface CourseClaimStatus {
  state: CourseClaimState;
  business: ClaimingBusiness | null;
}

export function useCourseClaim(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-claim', courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<ClaimingBusiness | null> => {
      if (!courseId) return null;

      const { data: course, error: courseError } = await supabase
        .from('golf_courses')
        .select('club_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!course?.club_id) return null;

      const { data: businesses, error: businessError } = await supabase
        .from('business_accounts')
        .select('id, name, slug, is_verified, logo_url')
        .eq('club_id', course.club_id)
        .eq('is_deleted', false)
        .limit(1);

      if (businessError) throw businessError;

      const business = businesses?.[0] ?? null;
      return (business as ClaimingBusiness) || null;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCourseClaimStatus(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-claim-status', courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseClaimStatus> => {
      if (!courseId) return { state: 'unclaimed', business: null };

      const { data: course, error: courseError } = await supabase
        .from('golf_courses')
        .select('club_id')
        .eq('id', courseId)
        .maybeSingle();
      if (courseError) throw courseError;
      if (!course?.club_id) return { state: 'unclaimed', business: null };

      const { data: businesses, error: businessError } = await supabase
        .from('business_accounts')
        .select('id, name, slug, is_verified, logo_url')
        .eq('club_id', course.club_id)
        .eq('is_deleted', false)
        .limit(1);
      if (businessError) throw businessError;

      const business = (businesses?.[0] as ClaimingBusiness | undefined) ?? null;
      if (business) return { state: 'claimed', business };

      const { data: claims, error: claimErr } = await supabase
        .from('course_claim_requests')
        .select('id, status')
        .eq('club_id', course.club_id)
        .in('status', ['pending', 'needs_more_info'])
        .limit(1);
      if (claimErr) throw claimErr;

      if (claims && claims.length > 0) return { state: 'pending', business: null };
      return { state: 'unclaimed', business: null };
    },
    staleTime: 3 * 60 * 1000,
  });
}
