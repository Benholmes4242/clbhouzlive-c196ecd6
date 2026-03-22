import React, { useEffect, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocation, Navigate } from 'react-router-dom';
import { logOrangeLoaderShow, logOrangeLoaderHide } from '@/utils/bootTimeline';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { isMedianApp } from '@/utils/median/isMedianApp';
import BetaGatePage from '@/pages/BetaGatePage';

const PUBLIC_PATHS = ['/auth', '/auth/verified', '/verified', '/auth/callback', '/auth/check-email', '/auth/reset-password'];

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper - Non-blocking auth wrapper
 * 
 * IMPORTANT: This component NEVER blocks UI with a loading screen.
 * Session resolves in the background while the app renders immediately.
 * 
 * Enforces:
 * 0. Beta gate — web visitors see holding page (Median app bypasses)
 * 1. Authentication — unauthenticated users redirected to /auth
 * 2. Onboarding — users who haven't completed profile setup redirected to /edit-profile
 */
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();
  const wasLoadingRef = useRef(false);

  // FIX 6: Enforce 30-day session timeout
  useSessionTimeout();

  // FIX I2: Check onboarding status for authenticated users
  const { data: onboardingData } = useOnboardingStatus(user?.id);

  // Track orange loader show/hide for boot timeline (audit only, no UI shown)
  useEffect(() => {
    if (loading && !wasLoadingRef.current) {
      wasLoadingRef.current = true;
      logOrangeLoaderShow();
    } else if (!loading && wasLoadingRef.current) {
      logOrangeLoaderHide();
    }
  }, [loading]);

  // Web-only beta gate: if not in Median app and not on a public path, show gate
  const inApp = isMedianApp();
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));
  if (!inApp && !isPublicPath) {
    return <BetaGatePage />;
  }
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
    // Auth pages and onboarding-exempt routes
    const isAuthPage = location.pathname === '/auth' 
      || location.pathname === '/auth/verified' 
      || location.pathname === '/verified'
      || location.pathname === '/auth/callback'
      || location.pathname === '/auth/check-email'
      || location.pathname === '/auth/reset-password';

    // If user is not authenticated and not on an auth page, redirect to auth
    if (!user && !isAuthPage) {
      return <Navigate to="/auth" replace />;
    }

    // If user is authenticated and on auth page, redirect to main site
    if (user && location.pathname === '/auth') {
      return <Navigate to="/" replace />;
    }

    // FIX I2: Onboarding gate — must come AFTER auth check
    // Skip for auth pages and edit-profile itself (avoid redirect loop)
    const isOnboardingExempt =
      isAuthPage ||
      location.pathname === '/edit-profile' ||
      location.pathname === '/onboarding/account-type';

    if (
      user &&
      !isOnboardingExempt &&
      onboardingData !== undefined &&
      !onboardingData.hasCompletedOnboarding
    ) {
      return <Navigate to="/edit-profile" replace />;
    }
  }

  // Always render children - no blocking loader
  return <>{children}</>;
};

export default AuthWrapper;
