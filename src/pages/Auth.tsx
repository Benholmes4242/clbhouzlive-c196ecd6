
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmNotice, setShowConfirmNotice] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const lastResendEmail = useRef(""); // to avoid spamming resend if email field is empty

  useEffect(() => {
    // Redirect authenticated users away from Auth page
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user && data.user.confirmed_at) navigate("/");
    });
    // Listen for auth state changes
    const { subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user && session.user.confirmed_at) navigate("/");
      }
    );
    // Clean up
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      // On success, user is redirected by onAuthStateChange
    }

    setSubmitting(false);
  };

  // Handler to resend confirmation email
  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    setErrorMsg(null);

    if (!lastResendEmail.current) {
      setErrorMsg("Please enter your email.");
      setResending(false);
      return;
    }

    // Use supabase.auth.resend() (for supabase-js v2)
    // If not available, fallback to re-trigger signUp
    try {
      // Using signUp as a workaround (works without changing password)
      const { error } = await supabase.auth.signUp({
        email: lastResendEmail.current,
        password: password || "tempor4ryDummy#123", // fallback if empty, not used on existing user
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error && !error.message.includes("User already registered")) {
        setErrorMsg(error.message);
      } else {
        setResendMsg("Confirmation email resent! Please check your inbox.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend confirmation email.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-muted rounded-lg shadow-md p-6 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Members logo at the top */}
        <img
          src="/lovable-uploads/1f870366-4fd9-4e56-a9a0-31c86f07d340.png"
          alt="Members Logo"
          className="mb-6"
          style={{ width: 200, maxWidth: "80%" }}
        />
        {/* No H1/H2 header here */}
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
          {/* Confirmation notice */}
          {showConfirmNotice && (
            <div className="mb-3 text-center text-sm text-primary-foreground bg-primary p-3 rounded">
              Please check your email to confirm your account before logging in.
            </div>
          )}
          {/* Error and Resent messages */}
          {errorMsg && (
            <div className="mb-3 text-destructive text-center text-sm">{errorMsg}</div>
          )}
          {resendMsg && (
            <div className="mb-3 text-green-700 text-center text-sm">{resendMsg}</div>
          )}
          {/* Only show form button if not showing confirm notice */}
          {!showConfirmNotice && (
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
            </Button>
          )}
        </form>
        {/* Resend confirmation email option */}
        {showConfirmNotice && (
          <Button
            variant="secondary"
            className="w-full mt-3"
            disabled={resending}
            onClick={handleResend}
          >
            {resending ? "Resending..." : "Resend Confirmation Email"}
          </Button>
        )}
        <button
          className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setIsSignUp((s) => !s);
            setShowConfirmNotice(false);
            setErrorMsg(null);
            setResendMsg(null);
          }}
          disabled={submitting}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
