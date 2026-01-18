import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

/**
 * Routes that should NOT redirect to onboarding (public or special routes)
 */
const EXEMPT_ROUTES = [
  '/auth',
  '/auth/callback', 
  '/auth/verified',
  '/signup',
  '/edit-profile',
  '/onboarding',
  '/create-profile',
  '/echo/share', // Public share pages
];

/**
 * Routes that are publicly accessible (no auth required)
 */
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/callback',
  '/auth/verified', 
  '/signup',
  '/echo/share',
];

/**
 * Global hook that enforces the onboarding rule:
 * 
 * RULE: First-time users after email authentication MUST be taken to 
 * the personalise profile page (/edit-profile) before accessing any 
 * protected routes.
 * 
 * This hook should be called once in the main App component to enforce
 * onboarding completion across ALL routes.
 */
export function useOnboardingEnforcer() {
  const { user, loading: authLoading } = useSupabaseSession();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check onboarding status for authenticated users
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus(user?.id);
  
  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || onboardingLoading) return;
    
    // Check if current route is exempt from onboarding check
    const currentPath = location.pathname;
    const isExemptRoute = EXEMPT_ROUTES.some(route => currentPath.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath.startsWith(route));
    
    // If user is not authenticated
    if (!user) {
      // If on a public route, that's fine - no redirect needed
      if (isPublicRoute) return;
      
      // Otherwise, don't redirect here - let the page handle auth requirements
      // (Some pages like course details are publicly viewable)
      return;
    }
    
    // User is authenticated - check onboarding
    if (isExemptRoute) {
      // Allow access to exempt routes regardless of onboarding status
      return;
    }
    
    // ENFORCE: User must complete onboarding before accessing any other route
    if (!onboardingData?.hasCompletedOnboarding) {
      console.log('[OnboardingEnforcer] User has not completed onboarding, redirecting to /edit-profile');
      console.log('[OnboardingEnforcer] Current path:', currentPath);
      navigate('/edit-profile', { replace: true });
    }
  }, [user, authLoading, onboardingData, onboardingLoading, location.pathname, navigate]);
}
