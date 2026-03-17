import React, { useEffect, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocation, Navigate } from 'react-router-dom';
import { logOrangeLoaderShow, logOrangeLoaderHide } from '@/utils/bootTimeline';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
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
 */
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();
  const wasLoadingRef = useRef(false);

  // FIX 6: Enforce 30-day session timeout
  useSessionTimeout();

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
    // If user is not authenticated and not on an auth page, redirect to auth
    const isAuthPage = location.pathname === '/auth' 
      || location.pathname === '/auth/verified' 
      || location.pathname === '/auth/callback'
      || location.pathname === '/auth/reset-password';
    if (!user && !isAuthPage) {
      return <Navigate to="/auth" replace />;
    }

    // If user is authenticated and on auth page, redirect to main site
    if (user && location.pathname === '/auth') {
      return <Navigate to="/" replace />;
    }

    // No verification gate — users enter immediately
  }

  // Always render children - no blocking loader
  return <>{children}</>;
};

export default AuthWrapper;
