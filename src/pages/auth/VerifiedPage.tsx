import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";

const APP_DEEP_LINK = "clbhouz://auth/signin?verified=1";
const WEB_FALLBACK = "/auth?confirmed=1";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const VerifiedPage: React.FC = () => {
  const query = useQuery();
  const [attemptedOpen, setAttemptedOpen] = useState(false);

  // Optional: pass through email if you want to prefill on web sign-in
  const email = (query.get("email") || "").trim();
  const webSigninHref = email
    ? `${WEB_FALLBACK}&email=${encodeURIComponent(email)}`
    : WEB_FALLBACK;

  useEffect(() => {
    // Gentle auto-attempt to open the app (non-blocking)
    // If it succeeds, the OS switches to the app.
    // If it fails, user stays here with clear CTAs.
    const t = window.setTimeout(() => {
      try {
        window.location.href = APP_DEEP_LINK;
      } finally {
        setAttemptedOpen(true);
      }
    }, 700);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Background - matches /auth page exactly */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#0d0d0d',
        }}
      />
      
      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.35) 100%)',
        }}
      />
      
      {/* Ultra-fine grain texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Card */}
        <div 
          className="w-full max-w-[420px]"
          style={{
            background: 'rgba(13, 13, 13, 0.95)',
            backdropFilter: 'blur(22px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
            borderRadius: '24px',
          }}
        >
          {/* Top strip */}
          <div className="flex items-center justify-end px-6 pt-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Secure
              <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
              Verified
            </div>
          </div>

          <div className="px-6 pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
            {/* Icon */}
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>

            {/* Headline */}
            <h1 
              className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Welcome to clbhouz
            </h1>

            {/* Body */}
            <p 
              className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-white/70 sm:text-base"
            >
              Your email address has been verified. You can now sign in to finish setting up your profile.
            </p>

            {/* Auto-attempt note */}
            <div className="mx-auto mt-5 max-w-xl text-center text-xs text-white/45">
              {attemptedOpen ? (
                <>
                  If the app didn't open automatically, use the button below.
                </>
              ) : (
                <>Opening the clbhouz app…</>
              )}
            </div>

            {/* Primary actions */}
            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2">
              {/* Open App - white primary button */}
              <a
                href={APP_DEEP_LINK}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-[#0D0F11] transition-all duration-150 active:scale-[0.98] active:brightness-95"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                Open clbhouz app
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>

              {/* Sign in on web - secondary dark button */}
              <Link
                to={webSigninHref}
                className="group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium text-white/90 transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: 'rgba(26, 28, 32, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                Sign in on the web
                <ExternalLink className="h-4 w-4 opacity-70" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-6 text-center text-[11px] text-white/35 max-w-[320px]">
          Tip: If you're on mobile and the app didn't open, make sure clbhouz is installed (and try tapping{" "}
          <span className="text-white/55 font-medium">Open clbhouz app</span> again).
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
