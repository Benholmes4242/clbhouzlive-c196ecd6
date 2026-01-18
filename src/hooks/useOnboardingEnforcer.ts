import { useEffect, useRef } from 'react';
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
  '/error', // Error pages
];

/**
 * Routes that are publicly accessible (no auth required)
 * These routes should NOT trigger onboarding redirects
 */
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/callback',
  '/auth/verified', 
  '/signup',
  '/echo/share',
  '/course/', // Course pages are public
  '/courses', // Courses list is public
  '/golfer/', // Public profiles
  '/explore', // Explore is public
  '/discover', // Discover is public
];

/**
 * Global hook that enforces the onboarding rule:
 * 
 * RULE: First-time users after email authentication MUST be taken to 
 * the personalise profile page (/edit-profile) before accessing any 
 * protected routes.
 * 
 * SAFETY: This hook includes multiple safeguards to prevent redirect loops:
 * - Only redirects once per session (hasRedirectedRef)
 * - Requires successful query (not just absence of data)
 * - Won't redirect if query errored
 * - Respects exempt routes
 * 
 * This hook should be called once in the main App component to enforce
 * onboarding completion across ALL routes.
 */
export function useOnboardingEnforcer() {
  const { user, loading: authLoading } = useSupabaseSession();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Prevent redirect loops - only redirect once per session
  const hasRedirectedRef = useRef(false);
  
  // Check onboarding status for authenticated users
  const { 
    data: onboardingData, 
    isLoading: onboardingLoading,
    isError: onboardingError,
    isFetched: onboardingFetched,
  } = useOnboardingStatus(user?.id);
  
  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || onboardingLoading) return;
    
    // Don't redirect if query errored - fail open, not closed
    // This prevents redirect loops when network fails
    if (onboardingError) {
      console.warn('[OnboardingEnforcer] Query errored, skipping enforcement');
      return;
    }
    
    // Must have actually fetched data
    if (!onboardingFetched) return;
    
    // Already redirected once this session - don't loop
    if (hasRedirectedRef.current) return;
    
    // Check if current route is exempt from onboarding check
    const currentPath = location.pathname;
    const isExemptRoute = EXEMPT_ROUTES.some(route => currentPath.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath.startsWith(route));
    
    // If user is not authenticated
    if (!user) {
      // Public routes are fine without auth
      return;
    }
    
    // User is authenticated - check onboarding
    if (isExemptRoute || isPublicRoute) {
      // Allow access to exempt/public routes regardless of onboarding status
      return;
    }
    
    // ENFORCE: User must complete onboarding before accessing protected routes
    // Only redirect if we explicitly have false (not undefined/null from error)
    if (onboardingData && onboardingData.hasCompletedOnboarding === false) {
      console.log('[OnboardingEnforcer] User has not completed onboarding, redirecting to /edit-profile');
      console.log('[OnboardingEnforcer] Current path:', currentPath);
      hasRedirectedRef.current = true;
      navigate('/edit-profile', { replace: true });
    }
  }, [user, authLoading, onboardingData, onboardingLoading, onboardingError, onboardingFetched, location.pathname, navigate]);
}
