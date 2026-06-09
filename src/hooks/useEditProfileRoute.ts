/**
 * Resolve the edit-profile route. Single source of truth now: /edit-profile.
 * Used for both first-login onboarding AND returning-user edits.
 */
export function useEditProfileRoute(): string {
  return '/edit-profile';
}
