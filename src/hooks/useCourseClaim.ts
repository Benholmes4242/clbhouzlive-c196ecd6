import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClaimingBusiness {
  id: string;
  name: string;
  slug: string | null;
  is_verified: boolean | null;
  logo_url: string | null;
}

export function useCourseClaim(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-claim', courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<ClaimingBusiness | null> => {
      if (!courseId) return null;

      // Get the course's club_id
      const { data: course } = await supabase
        .from('golf_courses')
        .select('club_id')
        .eq('id', courseId)
        .single();

      if (!course?.club_id) return null;

      // Find claiming business
      const { data: business } = await supabase
        .from('business_accounts')
        .select('id, name, slug, is_verified, logo_url')
        .eq('club_id', course.club_id)
        .eq('is_deleted', false)
        .single();

      return (business as ClaimingBusiness) || null;
    },
    staleTime: 10 * 60 * 1000,
  });
}
