import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import InviteRequestModal from "./InviteRequestModal";
import { posthog } from "@/lib/posthog";

interface AccessGateV2Props {
  children: React.ReactNode;
}

const AccessGateV2: React.FC<AccessGateV2Props> = ({ children }) => {
  const [accessCode, setAccessCode] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useSupabaseSession();

  useEffect(() => {
    // Track gate view
    posthog.capture('gate_view');
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if user has admin privileges
      if (user) {
        try {
          const { data, error } = await supabase.rpc('is_admin');
          if (!error && data === true) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }

      // Check for cookie-based session first
      try {
        const res = await fetch("https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/secure-site-access-check", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking cookie session:', error);
      }

      // Clean up legacy localStorage (transition complete)
      try {
        localStorage.removeItem('siteAccess');
      } catch (error) {
        // Silent cleanup
      }
      
      setLoading(false);
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
      const res = await fetch("https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/secure-site-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include", // Important for Set-Cookie
        body: JSON.stringify({
          accessCode: accessCode.toUpperCase(),
          domain: window.location.hostname
        })
      });

      const data = await res.json();

      posthog.capture('gate_submit', { success: res.ok && data?.success });

      if (res.ok && data?.success) {
        toast.success("Access Granted - Welcome to clubhouz!");
        posthog.capture('gate_access_granted');
        setHasAccess(true);
        setErrorMessage("");
        // Cookie is now set by the server, no need for localStorage
      } else {
        const msg = data?.message || "Invalid access code";
        setErrorMessage(msg);
        toast.error(msg);
        setAccessCode("");
      }
    } catch (error: any) {
      console.error('Error validating access code:', error);
      const msg = error.message || "Failed to validate access code";
      setErrorMessage(msg);
      toast.error(msg);
      posthog.capture('gate_submit', { success: false });
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
    <main 
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center px-4"
      style={{ 
        backgroundImage: "url(/assets/bg-course.jpg)",
        backgroundColor: "#1a4d2e" // Fallback color
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px]" />
      
      {/* Content Card */}
      <section className="relative z-10 w-[90%] max-w-[360px] rounded-[18px] bg-black/35 backdrop-blur-xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="Logo Mark"
            className="w-auto h-12 object-contain opacity-95"
          />
          <img
            src="/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"
            alt="clbhouz Logo"
            className="w-auto h-14 object-contain opacity-95"
          />
        </div>

        {/* Headline */}
        <h1 className="text-white text-[32px] font-semibold tracking-[.02em] leading-[1.2] mb-3">
          THE HOME<br/>OF GOLF
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

        {/* Request Invite */}
        <button 
          type="button"
          className="mt-4 text-white/85 text-[14px] underline-offset-4 hover:underline transition-colors"
          onClick={() => {
            posthog.capture('invite_open');
            setInviteModalOpen(true);
          }}
        >
          Request Invite
        </button>

        {/* Invite Request Modal */}
        <InviteRequestModal 
          open={inviteModalOpen} 
          onOpenChange={setInviteModalOpen} 
        />

        {/* Footer */}
        <p className="mt-6 text-xs text-white/60">
          © 2025 clubhouz
        </p>
      </section>
    </main>
  );
};

export default AccessGateV2;
