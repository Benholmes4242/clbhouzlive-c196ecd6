/**
 * Hook to check if the current user is an owner/admin of a verified business
 * that has claimed the course's club. Used for review responses & suggest-edit.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface BusinessClaimContext {
  businessId: string;
  businessName: string;
  businessSlug: string | null;
  businessLogoUrl: string | null;
  isVerified: boolean;
  role: string;
}

export function useBusinessClaimForCourse(courseId: string | undefined) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['business-claim-context', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async (): Promise<BusinessClaimContext | null> => {
      if (!courseId || !userId) return null;

      // Get course's club_id
      const { data: course } = await supabase
        .from('golf_courses')
        .select('club_id')
        .eq('id', courseId)
        .single();

      if (!course?.club_id) return null;

      // Find business claiming this club where user is owner/admin
      const { data: business } = await supabase
        .from('business_accounts')
        .select('id, name, slug, logo_url, is_verified')
        .eq('club_id', course.club_id)
        .eq('is_deleted', false)
        .single();

      if (!business) return null;

      // Check membership
      const { data: membership } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', business.id)
        .eq('user_profile_id', userId)
        .in('role', ['owner', 'admin'])
        .maybeSingle();

      if (!membership) return null;

      return {
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
        businessLogoUrl: business.logo_url,
        isVerified: business.is_verified || false,
        role: membership.role,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
