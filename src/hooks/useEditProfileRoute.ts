/**
 * Resolve the correct edit-profile route based on onboarding status.
 *
 * - New users (has_completed_onboarding === false) hit the 3-step wizard at
 *   `/edit-profile`.
 * - Returning users hit the single-page quick-edit at `/quick-edit-profile`.
 *
 * Use this for any user-initiated "Edit profile" affordance. Do NOT use for
 * auth/onboarding redirects — those should always target `/edit-profile`.
 */
import { useProfileData } from '@/hooks/useProfileData';

export function useEditProfileRoute(): string {
  const { profile } = useProfileData();
  const hasCompletedOnboarding = !!(profile as any)?.has_completed_onboarding;
  return hasCompletedOnboarding ? '/quick-edit-profile' : '/edit-profile';
}
