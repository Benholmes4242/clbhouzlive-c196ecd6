import React, { useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "./auth/AuthForm";
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { resolvePostAuthRoute } from '@/lib/auth/postAuthRoute';

interface AuthProps {
  defaultSignUp?: boolean;
}

const Auth: React.FC<AuthProps> = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasNavigated = useRef(false);

  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !hasNavigated.current) {
      hasNavigated.current = true;
      (async () => {
        const dest = await resolvePostAuthRoute(user.id, searchParams.get('redirect'));
        navigate(dest, { replace: true });
      })();
    }
  }, [user, navigate, searchParams]);

  // Catch session from OAuth (Apple/Google) completed in SFSafariViewController.
  // The callback page writes tokens to localStorage; we read them when the app resumes.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      if (hasNavigated.current) return;

      // 1. Direct session check (works if Supabase resolved via URL hash)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        hasNavigated.current = true;
        const dest = await resolvePostAuthRoute(existingSession.user.id, searchParams.get('redirect'));
        navigate(dest, { replace: true });
        return;
      }

      // 2. Check for handshake token written by the SFVC callback page
      try {
        const raw = localStorage.getItem('clbhouz_oauth_session');
        if (!raw) return;

        const payload = JSON.parse(raw);
        // Only accept tokens written in the last 5 minutes
        if (!payload.access_token || !payload.refresh_token || Date.now() - payload.ts > 5 * 60 * 1000) {
          localStorage.removeItem('clbhouz_oauth_session');
          return;
        }

        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });

        // Clean up handshake token regardless
        localStorage.removeItem('clbhouz_oauth_session');

        if (error || !session?.user) return;

        hasNavigated.current = true;
        const dest = await resolvePostAuthRoute(session.user.id, searchParams.get('redirect'));
        navigate(dest, { replace: true });
      } catch { /* handshake token invalid - ignore */ }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate, searchParams]);

  if (user) {
    // Redirect effect above is resolving the destination; hold a quiet dark
    // frame instead of flashing the sign-in hero (also covers the frame
    // between a successful verify and route change).
    return (
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, background: '#15171F', zIndex: 50 }}
      />
    );
  }

  return (
    <div className="w-full md:max-w-[440px] md:mx-auto">
      <AuthForm onWillNavigate={() => { hasNavigated.current = true; }} />
    </div>
  );
};
export default Auth;
