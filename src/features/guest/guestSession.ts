/**
 * GUEST SESSION BOOTSTRAP (brief §1). RootGate's only guest logic lives here
 * so it can be tested without mounting the app:
 *   - useGuestSessionBootstrap mints ONE anonymous session on a native or preview cold
 *     start with no stored session, tracking started/failed;
 *   - signedOutOutcome says what a signed-out RootGate renders: the canvas
 *     hold while the anonymous call is in flight, otherwise today's /auth.
 * With GUEST_BROWSING_ENABLED false the hook does nothing and the outcome is
 * always 'auth' — exactly today's behaviour.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasStoredSession } from '@/utils/auth/hasStoredSession';
import { GUEST_BROWSING_ENABLED } from './guestConfig';
import { trackGuestSessionFailed, trackGuestSessionStarted } from './guestAnalytics';

export type GuestAttempt = 'idle' | 'pending' | 'failed';

export function signedOutOutcome(args: {
  enabled: boolean;
  envStatus: string;
  guestAttempt: GuestAttempt;
  stored: boolean;
}): 'hold' | 'auth' {
  if (args.enabled && (args.envStatus === 'native' || args.envStatus === 'preview') && args.guestAttempt !== 'failed' && !args.stored) {
    return 'hold';
  }
  return 'auth';
}

// ONE in-flight anonymous sign-in, however many holds ask for it at once
// (RootGate at '/' and the app-level GuestSessionHold on deep links).
let inflight: ReturnType<typeof supabase.auth.signInAnonymously> | null = null;
function signInGuestOnce() {
  if (!inflight) {
    inflight = supabase.auth.signInAnonymously();
    // Shared only while in flight; once settled the session (or its absence) decides.
    inflight.then(() => { inflight = null; }, () => { inflight = null; });
  }
  return inflight;
}
/** Test seam. */
export function __resetGuestSignIn() { inflight = null; }

/** Paths that never mint a guest and never hold: sign-in and public pages. */
export function isGuestHoldExemptPath(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/')
    || pathname === '/delete-account' || pathname.startsWith('/legal')
    || pathname === '/privacy' || pathname === '/terms';
}

/**
 * Stage 2.2: the app-level hold. Every route except the exempt list renders
 * nothing — so nothing fetches — until the guest session exists (or the
 * attempt fails and today's signed-out behaviour takes over). Before this,
 * only RootGate ('/') held, and a cold deep link to /courses, /amateur or
 * /tourhub fetched with the anon key alone (the Stage 2.1 401s).
 */
export function guestHoldActive(args: {
  enabled: boolean; envStatus: string; authLoading: boolean; hasUser: boolean;
  stored: boolean; guestAttempt: GuestAttempt; pathname: string;
}): boolean {
  if (!args.enabled || isGuestHoldExemptPath(args.pathname)) return false;
  if (args.envStatus !== 'native' && args.envStatus !== 'preview') return false;
  if (args.hasUser) return false;
  if (args.stored) return false; // a stored session resolves itself
  return args.guestAttempt !== 'failed';
}

export function useGuestSessionBootstrap(args: {
  envStatus: string;
  authLoading: boolean;
  hasUser: boolean;
  /** Exempt paths (auth, legal) never mint a guest. */
  skip?: boolean;
}): GuestAttempt {
  const { envStatus, authLoading, hasUser, skip = false } = args;
  const [guestAttempt, setGuestAttempt] = useState<GuestAttempt>('idle');
  useEffect(() => {
    if (!GUEST_BROWSING_ENABLED) return;
    if (envStatus !== 'native' && envStatus !== 'preview') return;
    if (skip || authLoading || hasUser) return;
    if (hasStoredSession()) return;
    if (guestAttempt !== 'idle') return;
    setGuestAttempt('pending');
    signInGuestOnce()
      .then(({ error }) => {
        if (error) {
          trackGuestSessionFailed(error.message || 'anonymous_sign_in_failed');
          setGuestAttempt('failed');
        } else {
          trackGuestSessionStarted();
        }
      })
      .catch((err: unknown) => {
        trackGuestSessionFailed(err instanceof Error ? err.message : 'anonymous_sign_in_failed');
        setGuestAttempt('failed');
      });
  }, [envStatus, authLoading, hasUser, guestAttempt, skip]);
  return guestAttempt;
}
