import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, skip onboarding check (used for the edit-profile page itself) */
  skipOnboardingCheck?: boolean;
}

/**
 * Protected route wrapper that enforces:
 * 1. User must be authenticated
 * 2. User must have completed onboarding (redirects to /edit-profile if not)
 * 
 * RULE: First-time users after email authentication MUST be taken to 
 * the personalise profile page before accessing any protected routes.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  skipOnboardingCheck = false 
}) => {
  const { user, loading: authLoading } = useSupabaseSession();
  const location = useLocation();
  
  // Check onboarding status for authenticated users
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus(user?.id);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while checking onboarding status (only if we need to check it)
  if (!skipOnboardingCheck && onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ENFORCE: First-time users must complete onboarding before accessing any protected route
  // Skip this check only for the edit-profile page itself to avoid redirect loops
  if (!skipOnboardingCheck && !onboardingData?.hasCompletedOnboarding) {
    console.log('[ProtectedRoute] User has not completed onboarding, redirecting to edit-profile');
    return <Navigate to="/edit-profile" replace />;
  }

  // User is authenticated AND has completed onboarding, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
