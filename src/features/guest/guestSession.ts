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

export function useGuestSessionBootstrap(args: {
  envStatus: string;
  authLoading: boolean;
  hasUser: boolean;
}): GuestAttempt {
  const { envStatus, authLoading, hasUser } = args;
  const [guestAttempt, setGuestAttempt] = useState<GuestAttempt>('idle');
  useEffect(() => {
    if (!GUEST_BROWSING_ENABLED) return;
    if (envStatus !== 'native' && envStatus !== 'preview') return;
    if (authLoading || hasUser) return;
    if (hasStoredSession()) return;
    if (guestAttempt !== 'idle') return;
    setGuestAttempt('pending');
    supabase.auth
      .signInAnonymously()
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
  }, [envStatus, authLoading, hasUser, guestAttempt]);
  return guestAttempt;
}
