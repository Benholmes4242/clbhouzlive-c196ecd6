/**
 * GUEST CONVERSION MEMORY (brief §6). Before any flow that can replace the
 * guest session, the guest's user id (and the surface the card was opened
 * from) is stored here so guest_converted can trace a converted guest even
 * when the id changes. In memory only — a cold start has no guest to trace.
 */
import type { GuestSurfaceKey } from './guestGateStore';

let guestUserId: string | null = null;
let guestSurface: GuestSurfaceKey | null = null;

export function rememberGuestConversion(userId: string, surface: GuestSurfaceKey | null): void {
  guestUserId = userId;
  guestSurface = surface;
}

export function peekGuestConversion(): { guestUserId: string | null; surface: GuestSurfaceKey | null } {
  return { guestUserId, surface: guestSurface };
}

export function clearGuestConversion(): void {
  guestUserId = null;
  guestSurface = null;
}
