import { useEffect, useRef } from 'react';
import { useWhsConnection } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * CB46 — COUNT THE UNKNOWN-CONNECTION FALLBACK. Renders nothing.
 *
 * roundsGateState returns 'connected' on a settled failed read (CB45) because
 * that is the right thing to RENDER, but it is not a true statement about the
 * member. Nothing reports that label, so the lie is contained. This event is
 * what tells us whether the path is rare enough to leave contained, or common
 * enough to deserve a fourth state of its own.
 *
 * Same useWhsConnection key as the page (one request). `isError` is set only
 * after the retry policy has finished. Once per mount, the rounds_gate_viewed
 * discipline: the ref is set before tracking, so rerenders, a later recovery
 * and StrictMode replay never fire it again, and no correcting event exists.
 */
export function UnknownConnectionFallback({ userId }: { userId: string | undefined }) {
  const connection = useWhsConnection(userId);
  const tracked = useRef(false);
  const failed = !!userId && connection.isError;
  useEffect(() => {
    if (!failed || tracked.current) return;
    tracked.current = true;
    analyticsEvents.track('rounds_gate_unknown_fallback', { gate_state: 'unknown' });
  }, [failed]);
  return null;
}
