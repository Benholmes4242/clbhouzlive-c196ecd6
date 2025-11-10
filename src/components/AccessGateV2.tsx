import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { posthog } from "@/lib/posthog";


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
        setLoading(true);

        // Don't decide access until we know if there's a user or not
        if (user === undefined) {
          console.log('[AccessGate] User state still loading - waiting');
          return;
        }

        if (!user) {
          console.log('[AccessGate] No authenticated user - showing access form');
          setHasAccess(false);
          return;
        }

        console.log('[AccessGate] Calling secure-site-access-check via supabase.functions.invoke');
        const { data, error } = await supabase.functions.invoke('secure-site-access-check', { body: {} });

        if (error) {
          console.error('[AccessGate] Edge function error:', error);
          // Retry once after refreshing session (handles token refresh races)
          try {
            await supabase.auth.refreshSession();
            const retry = await supabase.functions.invoke('secure-site-access-check', { body: {} });
            if (retry.data?.ok && retry.data?.is_admin === true) {
              console.log('[AccessGate] Admin access granted after retry for', retry.data.user_id);
              setHasAccess(true);
              return;
            }
          } catch {}
          setHasAccess(false);
          return;
        }

        if (data?.ok && data?.is_admin === true) {
          console.log('[AccessGate] Admin access granted for', data.user_id, 'role:', data.role);
          setHasAccess(true);
        } else {
          console.log('[AccessGate] Authenticated but not admin – checking stored access');
          
          // Check if user has valid stored access from access code
          try {
            const storedAccessStr = localStorage.getItem('siteAccess');
            if (storedAccessStr) {
              const accessData = JSON.parse(storedAccessStr);
              if (accessData?.granted && accessData?.expiresAt) {
                const expiryDate = new Date(accessData.expiresAt);
                const now = new Date();
                
                if (now < expiryDate) {
                  console.log('[AccessGate] Valid stored access found – granting access');
                  setHasAccess(true);
                  return;
                } else {
                  console.log('[AccessGate] Stored access expired');
                  localStorage.removeItem('siteAccess');
                }
              }
            }
          } catch (parseError) {
            console.error('[AccessGate] Error parsing stored access:', parseError);
            localStorage.removeItem('siteAccess');
          }
          
          // No valid stored access
          console.log('[AccessGate] No valid stored access – showing access form');
          setHasAccess(false);
        }

      } catch (err) {
        console.error('[AccessGate] Unexpected error in checkAccess:', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();

    // Re-check access when tab becomes visible (with debounce)
    let visibilityTimeout: any;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('[AccessGate] Tab became visible - rechecking access in 200ms');
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          checkAccess();
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      const { data, error } = await supabase.functions.invoke('secure-site-access', {
        body: {
          accessCode: accessCode.toUpperCase(),
          domain: window.location.hostname
        }
      });

      if (error) {
        console.error('[AccessGate] Access code validation error:', error);
        const msg = "Failed to validate access code. Please try again.";
        setErrorMessage(msg);
        toast.error(msg);
        posthog.capture('gate_submit', { success: false, error: error.message });
      } else {
        posthog.capture('gate_submit', { success: data?.success });

        if (data?.success) {
          // Store access with 12-hour expiry
          const accessData = {
            granted: true,
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          };
          localStorage.setItem('siteAccess', JSON.stringify(accessData));
          
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
      }
    } catch (error: any) {
      console.error('[AccessGate] Unexpected error validating access code:', error);
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
