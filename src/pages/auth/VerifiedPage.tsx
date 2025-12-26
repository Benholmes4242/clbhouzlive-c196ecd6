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
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-page)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      {/* Subtle gradient glow behind card - matches /auth */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col items-center">
        {/* Card */}
        <div 
          className="w-full"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid rgba(214, 217, 222, 0.5)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Top strip */}
          <div className="flex items-center justify-end px-6 pt-6">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
              Secure
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Verified
            </div>
          </div>

          <div className="px-6 pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
            {/* Icon */}
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            {/* Headline */}
            <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Welcome to clbhouz
            </h1>

            {/* Body */}
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-gray-600 sm:text-base">
              Your email address has been verified. You can now sign in to finish setting up your profile.
            </p>

            {/* Auto-attempt note */}
            <div className="mx-auto mt-5 max-w-xl text-center text-xs text-gray-400">
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
              {/* Open App */}
              <a
                href={APP_DEEP_LINK}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D0F11] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition hover:bg-[#1a1d21] active:scale-[0.99]"
              >
                Open clbhouz app
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>

              {/* Sign in on web */}
              <Link
                to={webSigninHref}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
              >
                Sign in on the web
                <ExternalLink className="h-4 w-4 opacity-70" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-6 text-center text-[11px] text-gray-400">
          Tip: If you're on mobile and the app didn't open, make sure clbhouz is installed (and try tapping{" "}
          <span className="text-gray-600 font-medium">Open clbhouz app</span> again).
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
