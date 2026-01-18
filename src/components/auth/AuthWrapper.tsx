import React, { useEffect, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocation, Navigate } from 'react-router-dom';
import { logOrangeLoaderShow, logOrangeLoaderHide } from '@/utils/bootTimeline';
import { EmailVerificationGate } from './EmailVerificationGate';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper - Non-blocking auth wrapper
 * 
 * IMPORTANT: This component NEVER blocks UI with a loading screen.
 * Session resolves in the background while the app renders immediately.
 * 
 * Protected routes should handle their own loading states if needed.
 * 
 * EMAIL VERIFICATION GATE:
 * If user is authenticated but email_confirmed_at is null, show verification screen.
 * 
 * ONBOARDING GATE:
 * If user is authenticated and email confirmed but has_completed_onboarding is false,
 * redirect to /edit-profile to complete onboarding before accessing the app.
 */
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();
  const wasLoadingRef = useRef(false);

  // FIX 6: Enforce 30-day session timeout
  useSessionTimeout();

  // Check onboarding status for authenticated users
  const { data: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus(user?.id);

  // Track orange loader show/hide for boot timeline (audit only, no UI shown)
  useEffect(() => {
    if (loading && !wasLoadingRef.current) {
      wasLoadingRef.current = true;
      logOrangeLoaderShow(); // Logged for audit, but no UI blocks
    } else if (!loading && wasLoadingRef.current) {
      logOrangeLoaderHide();
    }
  }, [loading]);

  // NEVER block with a loading screen - always render children
  // Session resolves in the background

  // Only redirect after session is fully resolved
  if (!loading) {
    // Define pages that don't require authentication or are part of auth/onboarding flow
    const isAuthPage = location.pathname === '/auth' || location.pathname === '/auth/verified' || location.pathname === '/auth/callback';
    const isOnboardingPage = location.pathname === '/edit-profile' || location.pathname.startsWith('/onboarding');
    
    // If user is not authenticated and not on an auth page, redirect to auth
    if (!user && !isAuthPage) {
      return <Navigate to="/auth" replace />;
    }

    // If user is authenticated and on auth page, redirect to main site
    if (user && location.pathname === '/auth') {
      return <Navigate to="/" replace />;
    }

    // EMAIL VERIFICATION GATE
    // If user is authenticated but email not confirmed, show verification screen
    // Allow /auth/callback through so email verification links work
    if (user && !user.email_confirmed_at && location.pathname !== '/auth/callback') {
      return <EmailVerificationGate email={user.email || ''} />;
    }

    // ONBOARDING GATE - ENFORCED RULE
    // If user is authenticated, email confirmed, but hasn't completed onboarding,
    // they MUST go to the profile setup page first (except if already there)
    if (
      user && 
      user.email_confirmed_at && 
      !isAuthPage && 
      !isOnboardingPage && 
      !onboardingLoading && 
      onboardingStatus && 
      !onboardingStatus.hasCompletedOnboarding
    ) {
      return <Navigate to="/edit-profile" replace />;
    }
  }

  // Always render children - no blocking loader
  return <>{children}</>;
};

export default AuthWrapper;
