/** One global member-only setup guard; loading is never an incomplete profile. */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { isGuestUser } from '@/features/guest/useIsGuest';

export function onboardingExempt(path: string): boolean {
  return path === '/welcome' || path.startsWith('/welcome/') || path === '/auth' || path.startsWith('/auth/') || path.startsWith('/legal') || ['/privacy', '/terms', '/delete-account'].includes(path);
}
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, profile, loading } = useProfileData();
  if (!loading && user && !isGuestUser(user) && profile?.has_completed_onboarding === false && !onboardingExempt(pathname)) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}