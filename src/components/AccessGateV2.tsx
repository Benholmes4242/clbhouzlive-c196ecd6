import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";
import { AppLog } from "@/lib/logger";

interface AccessGateV2Props {
  children: React.ReactNode;
}

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

const AccessGateV2: React.FC<AccessGateV2Props> = ({ children }) => {
  const [accessCode, setAccessCode] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    captureEvent('gate_view');
  }, []);

  // ===== Boot Sequence =====
  useEffect(() => {
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
  }, []);

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
        
        toast.success("Access Granted - Welcome to clubhouz!");
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
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/gate/course-blur.jpg)" }}
      />
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
      
      <section className="relative z-10 w-[90%] max-w-[360px] rounded-[18px] bg-surface-card border border-border shadow-shadow-medium p-8 text-center">
        <div className="flex justify-center items-center mb-6">
          <img
            src="/images/brand/clubhouz-mark-dark.svg"
            alt="clubhouz"
            className="w-auto h-16 object-contain"
          />
        </div>

        <h1 className="font-display text-foreground text-display-xl font-bold leading-tight mb-3">
          YOUR HOME<br/>OF GOLF
        </h1>

        <p className="text-muted-foreground text-body-md mb-6">
          Enter access code to continue
        </p>

        {errorMessage && (
          <div 
            role="alert" 
            aria-live="polite"
            className="text-destructive text-sm mb-3"
          >
            {errorMessage}
          </div>
        )}

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
            className="w-full rounded-lg bg-surface-alt text-foreground placeholder:text-tertiary
                     border border-border px-4 py-3 text-body-md outline-none
                     focus:border-primary-accent focus:ring-1 focus:ring-primary-accent transition-all duration-motion-fast ease-standard
                     disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-label="Submit access code"
            className="w-full rounded-lg bg-primary-accent text-white py-3 font-medium text-body-md
                     hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {submitting ? "Checking..." : "ENTER"}
          </button>
        </form>

        <p className="mt-6 text-meta text-text-tertiary">
          © 2025 clubhouz
        </p>
      </section>
    </main>
  );
};

export default AccessGateV2;
