
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
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setShowConfirmNotice(false);

    if (isSignUp) {
      // EMAIL SIGNUP
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setShowConfirmNotice(true);
        lastResendEmail.current = email || "";
      }
    } else {
      // EMAIL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setShowConfirmNotice(true);
          setErrorMsg("Please confirm your email before logging in.");
          lastResendEmail.current = email || "";
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.user && !data.user.confirmed_at) {
        setShowConfirmNotice(true);
        setErrorMsg("Please confirm your email before logging in.");
        lastResendEmail.current = email || "";
      }
      // On success, user is redirected by onAuthStateChange in main Auth file
    }

    setSubmitting(false);
  };

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
        <Button type="submit" disabled={submitting} className="w-full">
          {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
        </Button>
      )}
    </form>
  );
};

export default AuthForm;
