import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
      {/* Glass container matching Clubhouse header/footer */}
      <div 
        className="flex flex-col items-center gap-4 p-8 rounded-3xl"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Logo mark */}
        <img
          src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />
        
        {/* Neutral spinner - white/grey, not orange */}
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        
        {/* Status text */}
        <p className="text-white/50 text-sm">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;