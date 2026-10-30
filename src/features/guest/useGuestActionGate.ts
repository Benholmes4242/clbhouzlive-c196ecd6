/**
 * THE GUEST ACTION GATE (brief §5). One helper for every entry point that
 * needs an account: when the caller is a guest it opens the closable action
 * card, tracks guest_gate_shown with trigger 'action', and returns true so
 * the caller stops — NOTHING is written. Members get false and act as today.
 */
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsGuest } from './useIsGuest';
import {
  getGuestUser,
  openGuestCard,
  surfaceForPath,
  type GuestAction,
} from './guestGateStore';
import { trackGuestGateShown } from './guestAnalytics';

export interface GuestActionContext {
  firstName?: string;
  postKind?: 'post' | 'round' | 'review';
}

/** Non-hook form for mutations and other non-React writers. */
export function gateGuestActionNow(action: GuestAction, ctx: GuestActionContext = {}): boolean {
  if (!getGuestUser()) return false;
  const surface = surfaceForPath(window.location.pathname);
  trackGuestGateShown({ surface, trigger: 'action', action });
  openGuestCard({ kind: 'action', surface, action, ...ctx });
  return true;
}

/** Hook form for components. Returns true when the tap was intercepted. */
export function useGuestActionGate() {
  const isGuest = useIsGuest();
  const location = useLocation();
  return useCallback(
    (action: GuestAction, ctx: GuestActionContext = {}): boolean => {
      if (!isGuest) return false;
      const surface = surfaceForPath(location.pathname);
      trackGuestGateShown({ surface, trigger: 'action', action });
      openGuestCard({ kind: 'action', surface, action, ...ctx });
      return true;
    },
    [isGuest, location.pathname],
  );
}
