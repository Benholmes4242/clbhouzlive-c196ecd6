/**
 * GUEST ANALYTICS (brief §8). Thin wrappers so the five event names and their
 * param shapes have exactly one writer each. Labels live in
 * src/features/admin/lib/eventLabels.ts.
 */
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { GuestAction, GuestSurfaceKey } from './guestGateStore';

export type GuestGateTrigger = 'scroll' | 'action' | 'join_button';
export type GuestGateChoice = 'apple' | 'google' | 'email' | 'login' | 'close';

export function trackGuestSessionStarted(): void {
  analyticsEvents.track('guest_session_started');
}

export function trackGuestSessionFailed(reason: string): void {
  analyticsEvents.track('guest_session_failed', { reason });
}

export function trackGuestGateShown(args: {
  surface: GuestSurfaceKey | null;
  trigger: GuestGateTrigger;
  action?: GuestAction;
}): void {
  analyticsEvents.track('guest_gate_shown', {
    surface: args.surface,
    trigger: args.trigger,
    ...(args.action ? { action: args.action } : {}),
  });
}

export function trackGuestGateChoice(args: {
  surface: GuestSurfaceKey | null;
  choice: GuestGateChoice;
}): void {
  analyticsEvents.track('guest_gate_choice', { surface: args.surface, choice: args.choice });
}

export function trackGuestConverted(args: {
  method: 'apple' | 'google' | 'email' | 'login';
  linked: boolean;
  surface: GuestSurfaceKey | null;
  guestUserId: string | null;
}): void {
  analyticsEvents.track('guest_converted', {
    method: args.method,
    linked: args.linked,
    surface: args.surface,
    guest_user_id: args.guestUserId,
  });
}
