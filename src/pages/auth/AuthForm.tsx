
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  isSignUp: boolean;
  setShowConfirmNotice: (b: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
  setSubmitting: (b: boolean) => void;
  setResendMsg: (msg: string | null) => void;
  lastResendEmail: React.MutableRefObject<string>;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  email: string;
  password: string;
  submitting: boolean;
  showConfirmNotice: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  setShowConfirmNotice,
  setErrorMsg,
  setSubmitting,
  setResendMsg,
  lastResendEmail,
  setEmail,
  setPassword,
  email,
  password,
  submitting,
  showConfirmNotice,
}) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setShowConfirmNotice(false);

    if (isSignUp) {
      // EMAIL SIGNUP - No email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else if (data?.user) {
        // User is automatically signed in after signup
        console.log("User signed up successfully:", data.user);
      }
    } else {
      // EMAIL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
      }
      // On success, user is redirected by onAuthStateChange in main Auth file
    }

    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setResendMsg("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    }

    setResetSubmitting(false);
  };

  if (showForgotPassword) {
    return (
      <form className="w-full" onSubmit={handleForgotPassword}>
        <div className="mb-4">
          <Input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={resetSubmitting}
            required
          />
        </div>
        <Button type="submit" disabled={resetSubmitting} className="w-full mb-3">
          {resetSubmitting ? "Sending..." : "Send Reset Email"}
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setShowForgotPassword(false)}
          disabled={resetSubmitting}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="w-full" onSubmit={handleAuth}>
      <div className="mb-4">
        <Input
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={submitting || showConfirmNotice}
          required
        />
      </div>
      <div className="mb-4">
        <Input
          type="password"
          value={password}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={submitting || showConfirmNotice}
          required
        />
      </div>
      {!showConfirmNotice && (
        <>
          <Button type="submit" disabled={submitting} className="w-full mb-3">
            {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
          </Button>
          {!isSignUp && (
            <button
              type="button"
              className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setShowForgotPassword(true)}
              disabled={submitting}
            >
              Forgot your password?
            </button>
          )}
        </>
      )}
    </form>
  );
};

export default AuthForm;
