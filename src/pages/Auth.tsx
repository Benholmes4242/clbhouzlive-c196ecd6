import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "./auth/AuthForm";
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

interface AuthProps {
  defaultSignUp?: boolean;
}

type AuthNotice = {
  type: 'success' | 'error';
  message: string;
} | null;

const Auth: React.FC<AuthProps> = ({ defaultSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<AuthNotice>(null);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lastResendEmail = useRef("");
  const hasNavigated = useRef(false);
  
  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  async function checkProfileAndOnboarding(userId: string): Promise<{
    hasProfile: boolean;
    hasCompletedOnboarding: boolean;
  }> {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, has_completed_onboarding')
      .eq('id', userId)
      .maybeSingle();
    
    return {
      hasProfile: !!data,
      hasCompletedOnboarding: data?.has_completed_onboarding ?? false,
    };
  }

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !hasNavigated.current) {
      hasNavigated.current = true;
      const redirectUser = async () => {
        const { hasProfile, hasCompletedOnboarding } = await checkProfileAndOnboarding(user.id);
        const redirectPath = searchParams.get('redirect');
        
        if (!hasProfile || !hasCompletedOnboarding) {
          navigate("/edit-profile", { replace: true });
        } else {
          navigate(redirectPath || "/", { replace: true });
        }
      };
      
      redirectUser();
    }
  }, [user, navigate, searchParams]);

  // Catch session from OAuth (Apple/Google) completed in SFSafariViewController.
  // The callback page writes tokens to localStorage; we read them when the app resumes.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Always clear stuck spinner immediately
      setSubmitting(false);

      if (hasNavigated.current) return;

      // 1. Direct session check (works if Supabase resolved via URL hash)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        hasNavigated.current = true;
        const { hasProfile, hasCompletedOnboarding } = await checkProfileAndOnboarding(existingSession.user.id);
        const redirectPath = searchParams.get('redirect');
        navigate(!hasProfile || !hasCompletedOnboarding ? '/edit-profile' : (redirectPath || '/'), { replace: true });
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
        const { hasProfile, hasCompletedOnboarding } = await checkProfileAndOnboarding(session.user.id);
        const redirectPath = searchParams.get('redirect');
        navigate(!hasProfile || !hasCompletedOnboarding ? '/edit-profile' : (redirectPath || '/'), { replace: true });
      } catch {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate, searchParams]);

  const clearAuthMessages = () => {
    setErrorMsg(null);
    setResendMsg(null);
    setAuthNotice(null);
  };

  return (
    <AuthForm
      isSignUp={isSignUp}
      setIsSignUp={setIsSignUp}
      setErrorMsg={setErrorMsg}
      setSubmitting={setSubmitting}
      setResendMsg={setResendMsg}
      lastResendEmail={lastResendEmail}
      setEmail={setEmail}
      setPassword={setPassword}
      email={email}
      password={password}
      submitting={submitting}
      authNotice={authNotice}
      setAuthNotice={setAuthNotice}
    />
  );
};
export default Auth;
