/**
 * THE GUEST ACTION GATE (brief §5). One helper for every entry point that
 * needs an account: when the caller is a guest it opens the closable action
 * card, tracks guest_gate_shown with trigger 'action', and returns true so
 * the caller stops — NOTHING is written. Members get false and act as today.
 */
import { useCallback, useEffect } from 'react';
import { GUEST_BROWSING_ENABLED } from './guestConfig';
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

/**
 * Sheet form (report, claim): a guest who reaches a sheet that writes never
 * sees it — the sheet asks to close and the action card opens instead. With
 * the switch off this returns `open` untouched and runs nothing.
 */
export function useGuestSheetGate(open: boolean, close: () => void, action: GuestAction): boolean {
  const blocked = GUEST_BROWSING_ENABLED && open && getGuestUser() !== null;
  useEffect(() => {
    if (!blocked) return;
    close();
    gateGuestActionNow(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);
  return open && !blocked;
}

/** Thrown from a mutation's onMutate when a guest reaches a write; the
 *  action card is already open and nothing is sent. */
export class GuestGatedError extends Error {
  constructor(action: GuestAction) {
    super(`guest_gated:${action}`);
    this.name = 'GuestGatedError';
  }
}

/** Write-layer backstop for mutations: opens the card and throws so the
 *  mutationFn never runs. No-op for members and with the switch off. */
export function assertNotGuestWrite(action: GuestAction, ctx: GuestActionContext = {}): void {
  if (!GUEST_BROWSING_ENABLED) return;
  if (gateGuestActionNow(action, ctx)) throw new GuestGatedError(action);
}
