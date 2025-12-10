import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setStatus("No authenticated user found. Redirecting to login...");
          setTimeout(() => navigate('/auth', { replace: true }), 1000);
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
          // No profile exists - redirect to profile setup (always personal)
          setStatus("Setting up your profile...");
          navigate('/create-profile', { replace: true });
        } else if (!profile.has_completed_onboarding) {
          // Profile exists but onboarding not complete
          setStatus("Completing onboarding...");
          navigate('/create-profile', { replace: true });
        } else {
          // Fully onboarded - go to home
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
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-slate-600 mb-4" />
      <p className="text-slate-600 text-sm">{status}</p>
    </div>
  );
};

export default AuthCallback;
