import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { posthog } from "@/lib/posthog";
import { edgePost } from "@/utils/callEdge";

const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AccessGateV2Props {
  children: React.ReactNode;
}

const AccessGateV2: React.FC<AccessGateV2Props> = ({ children }) => {
  const [accessCode, setAccessCode] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useSupabaseSession();

  useEffect(() => {
    // Track gate view
    posthog.capture('gate_view');
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user has admin privileges
        if (user) {
          try {
            const { data, error } = await supabase.rpc('is_admin');
            if (!error && data === true) {
              console.log('Admin access granted');
              setHasAccess(true);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        }

        // Check session with JWT token using resilient edge helper
        try {
          const data = await edgePost('secure-site-access-check', {});
          if (data?.ok) {
            console.log('Valid JWT session - access granted');
            setHasAccess(true);
          } else {
            console.log('No valid session found - showing access form');
            setHasAccess(false);
          }
        } catch (error) {
          console.warn('Gate check error:', error);
          // On error, show form to allow retry
          setHasAccess(false);
        }

        // Clean up legacy localStorage
        try {
          localStorage.removeItem('siteAccess');
        } catch (error) {
          // Silent cleanup
        }
      } catch (error) {
        console.error('Unexpected error in checkAccess:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      const msg = "Please enter an access code";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const data = await edgePost('secure-site-access', {
        accessCode: accessCode.toUpperCase(),
        domain: window.location.hostname
      });

      posthog.capture('gate_submit', { success: data?.success });

      if (data?.success) {
        toast.success("Access Granted - Welcome to clubhouz!");
        posthog.capture('gate_access_granted');
        setHasAccess(true);
        setErrorMessage("");
      } else {
        const msg = data?.message || "Invalid access code";
        setErrorMessage(msg);
        toast.error(msg);
        setAccessCode("");
      }
    } catch (error: any) {
      console.error('Error validating access code:', error);
      const msg = "Failed to validate access code. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      posthog.capture('gate_submit', { success: false, error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/gate/course-blur.jpg)" }}
      />
      
      {/* Overlay with blur */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Content Card */}
      <section className="relative z-10 w-[90%] max-w-[360px] rounded-[18px] bg-black/35 backdrop-blur-xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center items-center mb-6">
          <img
            src="/images/brand/clubhouz-mark-white.svg"
            alt="clubhouz"
            className="w-auto h-16 object-contain"
          />
        </div>

        {/* Headline */}
        <h1 className="font-display text-white text-[32px] font-semibold tracking-[.02em] leading-[1.2] mb-3">
          YOUR HOME<br/>OF GOLF
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-[15px] mb-6">
          Enter access code to continue
        </p>

        {/* Error message */}
        {errorMessage && (
          <div 
            role="alert" 
            aria-live="polite"
            className="text-red-400 text-sm mb-3"
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label htmlFor="gate-code" className="sr-only">
            Access code
          </label>
          <input
            id="gate-code"
            type="password"
            inputMode="text"
            autoComplete="off"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="••••••••••"
            disabled={submitting}
            className="w-full rounded-lg bg-white/10 text-white placeholder-white/40
                     border border-white/15 px-4 py-3 text-[15px] outline-none
                     focus:border-white/35 focus:ring-0 transition-colors
                     disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-label="Submit access code"
            className="w-full rounded-lg bg-white text-black py-3 font-medium text-[15px]
                     hover:bg-white/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Checking..." : "ENTER"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-xs text-white/60">
          © 2025 clubhouz
        </p>
      </section>
    </main>
  );
};

export default AccessGateV2;
