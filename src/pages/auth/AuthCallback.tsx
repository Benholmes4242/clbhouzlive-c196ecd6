import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Checking authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check URL hash for Supabase auth tokens (email verification comes with tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type') || searchParams.get('type');
        const accessToken = hashParams.get('access_token');
        
        // If this is an email confirmation/signup verification, go straight to verified page
        if (type === 'signup' || type === 'email' || type === 'email_confirmation') {
          // Clear any pending signup email
          localStorage.removeItem('pending_signup_email');
          
          // Sign out any session so user must enter password
          if (accessToken) {
            await supabase.auth.signOut();
          }
          
          // Redirect immediately to verified page
          navigate('/auth/verified', { replace: true });
          return;
        }

        // Get current user for other auth flows (OAuth, magic link, etc.)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Check if we have pending signup email (same-browser verification)
          const pendingEmail = localStorage.getItem('pending_signup_email');
          if (pendingEmail) {
            localStorage.removeItem('pending_signup_email');
            navigate('/auth/verified', { replace: true });
            return;
          }
          
          setStatus("No authenticated user found. Redirecting to login...");
          setTimeout(() => navigate('/auth', { replace: true }), 1000);
          return;
        }

        // Check if this is a newly confirmed email (from verification link)
        const pendingEmail = localStorage.getItem('pending_signup_email');
        
        if (pendingEmail) {
          localStorage.removeItem('pending_signup_email');
          await supabase.auth.signOut();
          navigate('/auth/verified', { replace: true });
          return;
        }

        setStatus("Checking profile...");

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, has_completed_onboarding')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        if (!profile) {
          setStatus("Setting up your profile...");
          navigate('/edit-profile', { replace: true });
        } else if (!profile.has_completed_onboarding) {
          setStatus("Completing onboarding...");
          navigate('/edit-profile', { replace: true });
        } else {
          setStatus("Welcome back!");
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus("Something went wrong. Redirecting to login...");
        setTimeout(() => navigate('/auth', { replace: true }), 1500);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
      {/* Glass container */}
      <div 
        className="flex flex-col items-center gap-4 p-8 rounded-3xl"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <img
          src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        <p className="text-white/50 text-sm">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
