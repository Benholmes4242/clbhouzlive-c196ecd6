import React, { useCallback, useEffect, useRef, useLayoutEffect, useState } from "react";
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
  // Stage 2.4: a guest (anonymous session) is signed out as far as sign-in is
  // concerned — no redirect, no hold, never resolvePostAuthRoute.
  const member = user && user.is_anonymous !== true ? user : null;
  const memberRef = useRef(member);
  memberRef.current = member;

  // Stage 2.6: while AuthForm is signing someone in, AuthForm owns navigation.
  // The redirect effect, both visibilitychange checks and the signed-in hold
  // stand down; release() hands control back for flows that end without
  // navigating, redirecting once if a member session exists by then.
  const formOwnsRef = useRef(false);
  const [formOwns, setFormOwns] = useState(false);
  const redirectMember = useCallback((id: string) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    (async () => {
      const dest = await resolvePostAuthRoute(id, searchParams.get('redirect'));
      navigate(dest, { replace: true });
    })();
  }, [navigate, searchParams]);
  const claimNavigation = useCallback(() => {
    formOwnsRef.current = true;
    setFormOwns(true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      formOwnsRef.current = false;
      setFormOwns(false);
      const m = memberRef.current;
      if (m) redirectMember(m.id);
    };
  }, [redirectMember]);

  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (member && !formOwnsRef.current) redirectMember(member.id);
  }, [member, redirectMember]);

  // Catch session from OAuth (Apple/Google) completed in SFSafariViewController.
  // The callback page writes tokens to localStorage; we read them when the app resumes.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      if (hasNavigated.current || formOwnsRef.current) return;

      // 1. Direct session check (works if Supabase resolved via URL hash)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user && existingSession.user.is_anonymous !== true) {
        if (formOwnsRef.current) return;
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

        if (error || !session?.user || session.user.is_anonymous === true) return;
        if (hasNavigated.current || formOwnsRef.current) return;

        hasNavigated.current = true;
        const dest = await resolvePostAuthRoute(session.user.id, searchParams.get('redirect'));
        navigate(dest, { replace: true });
      } catch { /* handshake token invalid - ignore */ }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate, searchParams]);

  if (member && !formOwns) {
    // Redirect effect above is resolving the destination; hold a quiet dark
    // frame instead of flashing the sign-in hero (also covers the frame
    // between a successful verify and route change).
    return (
      <div
        aria-hidden
        data-auth-signed-in-hold
        style={{ position: 'fixed', inset: 0, background: 'var(--welcome-canvas)', zIndex: 50 }}
      />
    );
  }

  return (
    <div className="w-full md:max-w-[440px] md:mx-auto">
      <AuthForm claimNavigation={claimNavigation} />
    </div>
  );
};
export default Auth;
