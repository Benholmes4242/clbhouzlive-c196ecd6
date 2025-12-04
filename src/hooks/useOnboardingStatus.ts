import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  userType: string | null;
}

/**
 * Hook to check if the current user has completed onboarding.
 * Returns loading state and onboarding completion status.
 */
export function useOnboardingStatus(userId: string | undefined) {
  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', userId],
    queryFn: async (): Promise<OnboardingStatus> => {
      if (!userId) {
        return { hasCompletedOnboarding: false, userType: null };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, user_type')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useOnboardingStatus] Error:', error);
        // If profile doesn't exist yet, return not completed
        return { hasCompletedOnboarding: false, userType: null };
      }

      return {
        hasCompletedOnboarding: data?.has_completed_onboarding ?? false,
        userType: data?.user_type ?? null,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
