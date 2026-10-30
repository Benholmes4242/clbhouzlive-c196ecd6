/**
 * Stage 2.2 — app-level guest session hold (rules in guestSession.ts).
 * Wraps every route: while a preview/native cold start has no session, the
 * plain canvas shows and NO child mounts, so no request can leave with the
 * anon key alone. Switch off: renders children untouched, reads nothing.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useEnvStatus } from '@/utils/native/envStatus';
import { hasStoredSession } from '@/utils/auth/hasStoredSession';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { GUEST_BROWSING_ENABLED } from './guestConfig';
import { guestHoldActive, isGuestHoldExemptPath, useGuestSessionBootstrap } from './guestSession';

function Hold({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useSupabaseSession();
  const envStatus = useEnvStatus();
  const { pathname } = useLocation();
  const guestAttempt = useGuestSessionBootstrap({ envStatus, authLoading, hasUser: !!user, skip: isGuestHoldExemptPath(pathname) });
  const hold = guestHoldActive({
    enabled: true, envStatus, authLoading, hasUser: !!user,
    stored: hasStoredSession(), guestAttempt, pathname,
  });
  if (hold) {
    return <div aria-hidden data-guest-session-hold style={{ position: 'fixed', inset: 0, background: PAGE_CANVAS, zIndex: 2147483000 }} />;
  }
  return <>{children}</>;
}

export function GuestSessionHold({ children }: { children: React.ReactNode }) {
  if (!GUEST_BROWSING_ENABLED) return <>{children}</>;
  return <Hold>{children}</Hold>;
}
