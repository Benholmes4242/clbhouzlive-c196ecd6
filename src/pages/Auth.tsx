import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AuthForm from "./auth/AuthForm";
import ConfirmNotice from "./auth/ConfirmNotice";
import AuthLayout from "./auth/AuthLayout";
import BottomNavigation from "@/components/BottomNavigation";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmNotice, setShowConfirmNotice] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const lastResendEmail = useRef(""); // to avoid spamming resend if email field is empty

  // Helper to check if a profile exists for a user
  async function checkProfileExists(userId: string): Promise<boolean> {
    const { data } = await supabase.from('user_profiles').select('id').eq('id', userId).maybeSingle();
    return !!data;
  }

  // Helper to create profile with username from signup
  async function createUserProfile(userId: string, userData: any) {
    const username = userData?.username;
    
    const profileData = {
      id: userId,
      username: username || null,
      display_name: null,
      user_type: 'individual' as const,
      is_public: true,
    };

    const { error } = await supabase.from('user_profiles').upsert(profileData);
    if (error) {
      console.error('Error creating user profile:', error);
    }
  }

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Check if this is a new signup with username data
          if (event === 'SIGNED_UP' && session.user.user_metadata?.username) {
            await createUserProfile(session.user.id, session.user.user_metadata);
          }
          
          // After login/signup, check if profile exists
          const hasProfile = await checkProfileExists(session.user.id);
          if (hasProfile) {
            navigate("/profile", { replace: true });
          } else {
            navigate("/create-profile", { replace: true });
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <>
      <AuthLayout
        isSignUp={isSignUp}
        toggleAuthMode={() => {
          setIsSignUp((s) => !s);
          setShowConfirmNotice(false);
          setErrorMsg(null);
          setResendMsg(null);
        }}
        submitting={submitting}
      >
        <AuthForm
          isSignUp={isSignUp}
          setShowConfirmNotice={setShowConfirmNotice}
          setErrorMsg={setErrorMsg}
          setSubmitting={setSubmitting}
          setResendMsg={setResendMsg}
          lastResendEmail={lastResendEmail}
          setEmail={setEmail}
          setPassword={setPassword}
          email={email}
          password={password}
          submitting={submitting}
          showConfirmNotice={showConfirmNotice}
        />
        {/* Only show confirmation notice if explicitly needed (shouldn't happen with disabled email confirmation) */}
        {showConfirmNotice && (
          <div className="mb-3 text-center text-sm text-primary-foreground bg-primary p-3 rounded">
            Please check your email to confirm your account to become a member.
          </div>
        )}
        {errorMsg && (
          <div className="mb-3 text-destructive text-center text-sm">{errorMsg}</div>
        )}
        {resendMsg && (
          <div className="mb-3 text-green-700 text-center text-sm">{resendMsg}</div>
        )}
        {showConfirmNotice && (
          <ConfirmNotice
            lastResendEmail={lastResendEmail}
            password={password}
            setResending={setResending}
            resending={resending}
            setResendMsg={setResendMsg}
            setErrorMsg={setErrorMsg}
          />
        )}
      </AuthLayout>
      <BottomNavigation />
    </>
  );
};
export default Auth;
