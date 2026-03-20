import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";
import { AppLog } from "@/lib/logger";

interface AccessGateV2Props {
  children: React.ReactNode;
}

// Auth route prefixes that should bypass the access gate
// Using prefixes so any new /auth/* routes are automatically bypassed
const AUTH_BYPASS_PREFIXES = ['/auth', '/onboarding', '/edit-profile'];

// ===== Session Storage Utils =====
const KEY = 'clubhouz_gate_session';
type GateSession = { token: string; expiresAt: string };

// ===== Validation Cache Utils =====
const VALIDATION_CACHE_KEY = 'clubhouz_gate_validation_cache';
const VALIDATION_CACHE_TTL_MS = 60_000;

type ValidationCache = {
  timestamp: number;
  status: 'valid' | 'invalid';
};

const getValidationCache = (): ValidationCache | null => {
  try {
    const raw = sessionStorage.getItem(VALIDATION_CACHE_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw) as ValidationCache;
    if (!parsed?.timestamp) return null;
    
    const age = Date.now() - parsed.timestamp;
    if (age > VALIDATION_CACHE_TTL_MS) {
      sessionStorage.removeItem(VALIDATION_CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
};

const setValidationCache = (status: 'valid' | 'invalid') => {
  try {
    const cache: ValidationCache = {
      timestamp: Date.now(),
      status,
    };
    sessionStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

const clearValidationCache = () => {
  try {
    sessionStorage.removeItem(VALIDATION_CACHE_KEY);
  } catch {
    // Ignore
  }
};

const getSession = (): GateSession | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

const setSession = (s: GateSession | null) => {
  if (!s) {
    localStorage.removeItem(KEY);
    clearValidationCache();
  } else {
    localStorage.setItem(KEY, JSON.stringify(s));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
};

// ===== Single-flight + Retry Utils =====
let inflight: Promise<void> | null = null;
let renewTimer: ReturnType<typeof setTimeout>;
const SAFETY_MS = 60_000;

async function singleFlight(fn: () => Promise<void>) {
  if (inflight) return inflight;
  inflight = fn().finally(() => (inflight = null));
  return inflight;
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let delay = 500;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw new Error('Retry failed');
}

// ===== Schedule Renewal =====
function scheduleRenew(expiresAtIso: string, checkFn: (skipCache?: boolean) => Promise<void>) {
  const t = new Date(expiresAtIso).getTime() - Date.now() - SAFETY_MS;
  clearTimeout(renewTimer);
  renewTimer = setTimeout(() => {
    singleFlight(() => checkFn(true));
  }, Math.max(15_000, t));
}

// ===== Check/Refresh Token =====
async function checkOrRefresh(skipCache = false): Promise<void> {
  const sess = getSession();
  if (!sess?.token) throw new Error('NO_SESSION');

  if (!skipCache) {
    const cached = getValidationCache();
    if (cached) {
      AppLog.debug('AccessGate', 'Using cached validation result');
      if (cached.status === 'valid') {
        scheduleRenew(sess.expiresAt, checkOrRefresh);
        return;
      } else {
        throw new Error('EXPIRED');
      }
    }
  }

  AppLog.debug('AccessGate', 'Performing fresh validation check');
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-site-access-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: sess.token }),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    if (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN') {
      setSession(null);
      clearValidationCache();
      setValidationCache('invalid');
      throw new Error('EXPIRED');
    }
    throw new Error('TRANSIENT');
  }

  const next: GateSession = {
    token: data.sessionToken || sess.token,
    expiresAt: data.expiresAt || sess.expiresAt,
  };
  
  setSession(next);
  setValidationCache('valid');
  scheduleRenew(next.expiresAt, checkOrRefresh);
}

// Inner component that safely uses useLocation (only rendered inside Router)
const AccessGateInner: React.FC<AccessGateV2Props> = ({ children }) => {
  const location = useLocation();
  
  const [accessCode, setAccessCode] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  // Only enter "loading" when a session exists and needs validation.
  // This prevents any flash of app content for first-time users with no session.
  const [loading, setLoading] = useState(() => !!getSession());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const cancelledRef = useRef(false);
  
  // Check if current route should bypass the gate (prefix match)
  const shouldBypass = useMemo(() => {
    return AUTH_BYPASS_PREFIXES.some(prefix => 
      location.pathname === prefix || location.pathname.startsWith(prefix + '/')
    );
  }, [location.pathname]);

  // Track gate view (only when not bypassing)
  useEffect(() => {
    if (!shouldBypass) {
      captureEvent('gate_view');
    }
  }, [shouldBypass]);

  // ===== Boot Sequence =====
  useEffect(() => {
    // Skip boot sequence for bypassed routes
    if (shouldBypass) return;
    
    cancelledRef.current = false;

    const boot = async () => {
      const sess = getSession();
      
      if (!sess) {
        AppLog.debug('AccessGate', 'No session found - showing gate');
        setLoading(false);
        setHasAccess(false);
        return;
      }

      try {
        AppLog.debug('AccessGate', 'Session found, validating...');
        await retry(() => singleFlight(checkOrRefresh), 3);
        
        if (!cancelledRef.current) {
          AppLog.debug('AccessGate', 'Session valid - granting access');
          setHasAccess(true);
        }
      } catch (e: any) {
        if (cancelledRef.current) return;
        
        if (e?.message === 'EXPIRED') {
          AppLog.debug('AccessGate', 'Session expired - showing gate');
          setSession(null);
          setHasAccess(false);
        } else {
          AppLog.warn('AccessGate', 'Transient error, staying in last-known-good state:', e);
          setTimeout(() => singleFlight(checkOrRefresh).catch(() => {}), 10_000);
          setHasAccess(true);
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    boot();

    // ===== Visibility Change Handler =====
    let visTimer: ReturnType<typeof setTimeout>;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(visTimer);
      visTimer = setTimeout(() => {
        if (getSession()) {
          singleFlight(checkOrRefresh).catch(() => {});
        }
      }, 800);
    };
    document.addEventListener('visibilitychange', onVis);

    // ===== Multi-Tab Sync =====
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      
      const sess = getSession();
      if (!sess) {
        AppLog.debug('AccessGate', 'Other tab logged out - showing gate');
        setHasAccess(false);
        return;
      }
      
      scheduleRenew(sess.expiresAt, checkOrRefresh);
    };
    window.addEventListener('storage', onStorage);

    return () => {
      cancelledRef.current = true;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('storage', onStorage);
      clearTimeout(renewTimer);
      clearTimeout(visTimer);
    };
  }, [shouldBypass]);
  
  // Bypass gate for auth routes - render children immediately (AFTER all hooks)
  if (shouldBypass) {
    return <>{children}</>;
  }

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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-site-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode.toUpperCase(),
          domain: window.location.hostname
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const msg = data?.message || "Invalid access code";
        setErrorMessage(msg);
        toast.error(msg);
        setAccessCode("");
        captureEvent('gate_submit', { success: false, error: msg });
      } else {
        const { sessionToken, expiresAt } = data;
        
        setSession({ token: sessionToken, expiresAt });
        setValidationCache('valid');
        scheduleRenew(expiresAt, checkOrRefresh);
        
        toast.success("Access granted");
        captureEvent('gate_submit', { success: true });
        captureEvent('gate_access_granted');
        
        setHasAccess(true);
        setErrorMessage("");
      }
    } catch (error: any) {
      AppLog.error('AccessGate', 'Unexpected error validating access code:', error);
      const msg = "Failed to validate access code. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      captureEvent('gate_submit', { success: false, error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Never block with a dedicated loading screen.
  // Render children while we validate access in the background; page-level skeletons handle UX.
  if (loading) {
    return <>{children}</>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4">
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/gate/course-blur.jpg)" }}
      />
      
      {/* Dark overlay with blur */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Minimal access box */}
      <section className="relative z-10 w-[280px] rounded-sq-md bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-6 py-5">
        {/* Single line of text */}
        <p className="text-[15px] text-[#BFBFBF] text-center mb-4 font-normal">
          Enter access code to continue
        </p>

        {/* Error message */}
        {errorMessage && (
          <div 
            role="alert" 
            aria-live="polite"
            className="text-destructive text-xs text-center mb-3"
          >
            {errorMessage}
          </div>
        )}

        <form className="flex flex-col items-center gap-3" onSubmit={handleSubmit}>
          <label htmlFor="gate-code" className="sr-only">
            Access code
          </label>
          <input
            id="gate-code"
            type="password"
            inputMode="text"
            autoComplete="off"
            autoFocus
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={submitting}
            className="w-[80%] rounded-sq-sm bg-white text-foreground
                     border border-slate-200 px-3 py-2.5 text-sm outline-none text-center
                     focus:border-slate-600 focus:ring-2 focus:ring-slate-300/70 focus:ring-offset-1 
                     transition-all duration-150 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-label="Submit access code"
            className="w-[80%] rounded-sq-sm bg-[#6E7A86] text-white py-2.5 font-medium text-sm
                     hover:bg-[#5F6B76] active:bg-[#566068] disabled:opacity-60 transition-colors"
          >
            {submitting ? "..." : "ENTER"}
          </button>
        </form>
      </section>

      {/* Copyright below the box */}
      <p className="relative z-10 mt-4 text-xs text-[#9CA3AF]">
        © 2025 clubhouz
      </p>
    </main>
  );
};

// Wrapper that handles being rendered outside Router context
const AccessGateV2: React.FC<AccessGateV2Props> = ({ children }) => {
  // Check bypass using window.location first (works outside Router)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const shouldBypassEarly = useMemo(() => {
    return AUTH_BYPASS_PREFIXES.some(prefix => 
      pathname === prefix || pathname.startsWith(prefix + '/')
    );
  }, [pathname]);
  
  // If we should bypass, skip the gate entirely (no Router needed)
  if (shouldBypassEarly) {
    return <>{children}</>;
  }
  
  // Otherwise render the inner gate which uses useLocation
  return <AccessGateInner>{children}</AccessGateInner>;
};

export default AccessGateV2;
