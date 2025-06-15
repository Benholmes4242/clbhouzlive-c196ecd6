
import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users away from Auth page
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/");
    });
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) navigate("/");
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
        setErrorMsg("Check your email to confirm & finish sign up!");
      }
    } else {
      // EMAIL LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      // On success, user is redirected by onAuthStateChange
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-muted rounded-lg shadow-md p-6 w-full max-w-md mx-auto flex flex-col items-center">
        <h1 className="text-2xl font-semibold mb-5">{isSignUp ? "Sign Up" : "Sign In"}</h1>
        <form className="w-full" onSubmit={handleAuth}>
          <div className="mb-4">
            <Input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={submitting}
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
              disabled={submitting}
              required
            />
          </div>
          {errorMsg && (
            <div className="mb-3 text-destructive text-center text-sm">{errorMsg}</div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
          </Button>
        </form>
        <button
          className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setIsSignUp((s) => !s);
            setErrorMsg(null);
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
