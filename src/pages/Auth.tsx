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
  const lastResendEmail = useRef(""); // to avoid spamming resend if email field is empty
  
  // Hide bottom navigation and header on auth pages
  useHideBottomNav();
  useHideHeader();

  // Bleed behind notch/safe-area like Clubhouse & Tour Hub
  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  // Helper to check profile and onboarding status
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

  useEffect(() => {
    // Only redirect if user is already authenticated when component mounts
    if (user) {
      const redirectUser = async () => {
        const { hasProfile, hasCompletedOnboarding } = await checkProfileAndOnboarding(user.id);
        const redirectPath = searchParams.get('redirect');
        
        if (!hasProfile || !hasCompletedOnboarding) {
          // Profile doesn't exist or onboarding not complete - redirect to edit profile
          navigate("/edit-profile", { replace: true });
        } else {
          // Fully onboarded - go to requested page or home
          navigate(redirectPath || "/", { replace: true });
        }
      };
      
      redirectUser();
    }
  }, [user, navigate, searchParams]);

  // Clear all auth messages helper
  const clearAuthMessages = () => {
    setShowConfirmNotice(false);
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
