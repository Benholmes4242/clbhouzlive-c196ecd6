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
    <div className="min-h-screen w-full bg-[#070707] relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10">
        {/* Card */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          {/* Top strip */}
          <div className="flex items-center justify-end px-6 pt-6">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Secure
              <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
              Verified
            </div>
          </div>

          <div className="px-6 pb-7 pt-5 sm:px-10 sm:pb-10 sm:pt-7">
            {/* Icon */}
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>

            {/* Headline */}
            <h1 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Welcome to clbhouz
            </h1>

            {/* Body */}
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-white/70 sm:text-base">
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
              {/* Open App */}
              <a
                href={APP_DEEP_LINK}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition active:scale-[0.99]"
              >
                Open clbhouz app
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>

              {/* Sign in on web */}
              <Link
                to={webSigninHref}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/8 active:scale-[0.99]"
              >
                Sign in on the web
                <ExternalLink className="h-4 w-4 opacity-80" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-6 text-center text-[11px] text-white/35">
          Tip: If you're on mobile and the app doesn't open, make sure clbhouz is installed (and try tapping{" "}
          <span className="text-white/55">Open clbhouz App</span> again).
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
