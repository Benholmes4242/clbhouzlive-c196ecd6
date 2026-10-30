/**
 * GUEST GATE STATE — session-scoped, in memory only.
 *
 * Two kinds of state live here:
 *   1. lockedSurfaces — once a surface's free look is used up it stays locked
 *      for the rest of the app session; a cold start resets it (module state).
 *      Each course page has its own key (`course:<id>`).
 *   2. The open card request — a tiny external store so non-React writers
 *      (follow mutation, conversation starter) can open the action card and
 *      the GuestGateHost can render it.
 *
 * The current session user is mirrored from onAuthStateChange so non-hook
 * code can answer "is this a guest" without a component.
 *
 * NOTHING here touches storage, and nothing here runs on a timer: the only
 * triggers are scroll depth and taps.
 */
import type { User } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GUEST_BROWSING_ENABLED } from './guestConfig';
import { isGuestUser } from './useIsGuest';

// ---------------------------------------------------------------------------
// Surface keys
// ---------------------------------------------------------------------------
export type GuestSurface = 'clubhouse' | 'explore' | 'courses' | 'tour' | `course:${string}`;
export type GuestSurfaceKey = GuestSurface | (string & {});

export function courseSurfaceKey(courseId: string): GuestSurfaceKey {
  return `course:${courseId}`;
}

/** The surface a pathname belongs to, or null when it is not a free-look
 *  surface. Course pages key on the course id so each gets its own look. */
export function surfaceForPath(pathname: string): GuestSurfaceKey | null {
  if (pathname === '/' || pathname === '/clubhouse') return 'clubhouse';
  if (pathname === '/amateur' || pathname.startsWith('/amateur/')) return 'explore';
  if (pathname === '/courses') return 'courses';
  const course = pathname.match(/^\/courses\/([^/]+)(?:\/(?:holes|rounds))?\/?$/);
  if (course) return courseSurfaceKey(course[1]);
  if (pathname === '/tourhub' || pathname.startsWith('/tourhub/')) return 'tour';
  return null;
}

// ---------------------------------------------------------------------------
// Locked surfaces (session memory)
// ---------------------------------------------------------------------------
const lockedSurfaces = new Set<string>();

export function isSurfaceLocked(surface: GuestSurfaceKey): boolean {
  return lockedSurfaces.has(surface);
}

/** Returns true when this call newly locked the surface. */
export function lockSurface(surface: GuestSurfaceKey): boolean {
  if (lockedSurfaces.has(surface)) return false;
  lockedSurfaces.add(surface);
  return true;
}

// ---------------------------------------------------------------------------
// Card requests
// ---------------------------------------------------------------------------
export type GuestAction =
  | 'like'
  | 'comment'
  | 'follow'
  | 'share'
  | 'post'
  | 'rate'
  | 'message'
  | 'own_profile'
  | 'connect_handicap'
  | 'claim_course'
  | 'request_course'
  | 'report'
  | 'other';

export type GuestCardRequest =
  | { kind: 'scroll'; surface: GuestSurfaceKey }
  | { kind: 'join_button'; surface: GuestSurfaceKey }
  | {
      kind: 'action';
      surface: GuestSurfaceKey | null;
      action: GuestAction;
      firstName?: string;
      postKind?: 'post' | 'round' | 'review';
    };

let cardRequest: GuestCardRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function getGuestCardRequest(): GuestCardRequest | null {
  return cardRequest;
}

export function subscribeGuestCards(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function openGuestCard(request: GuestCardRequest): void {
  if (!GUEST_BROWSING_ENABLED) return;
  cardRequest = request;
  emit();
}

export function closeGuestCard(): void {
  if (!cardRequest) return;
  cardRequest = null;
  emit();
}

export function useGuestCardRequest(): GuestCardRequest | null {
  return useSyncExternalStore(subscribeGuestCards, getGuestCardRequest, () => null);
}

// ---------------------------------------------------------------------------
// Current user mirror (for non-React writers)
// ---------------------------------------------------------------------------
let currentUser: User | null = null;
// Switch off: no auth subscription at all.
if (GUEST_BROWSING_ENABLED) try {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
  });
} catch {
  /* guest gating never throws */
}

/** The current session user when it is an anonymous (guest) session. */
export function getGuestUser(): User | null {
  if (!GUEST_BROWSING_ENABLED) return null;
  return isGuestUser(currentUser) ? currentUser : null;
}

// ---------------------------------------------------------------------------
// Open course sheets (Stage 2.3). While a course holes/rounds sheet is open
// the card, shade and nav are raised above the sheet so the nav stays the
// way out. Counted, so overlapping sheets release correctly.
// ---------------------------------------------------------------------------
let openCourseSheets = 0;
const sheetListeners = new Set<() => void>();
export function registerGuestCourseSheet(): () => void {
  openCourseSheets += 1;
  sheetListeners.forEach((fn) => fn());
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCourseSheets = Math.max(0, openCourseSheets - 1);
    sheetListeners.forEach((fn) => fn());
  };
}
function subscribeSheets(fn: () => void) { sheetListeners.add(fn); return () => { sheetListeners.delete(fn); }; }
export function useGuestCourseSheetOpen(): boolean {
  return useSyncExternalStore(subscribeSheets, () => openCourseSheets > 0, () => false);
}
/** BottomSheet's default base is 1400 (surface 1401); raised layers sit above. */
export const GUEST_RAISED_Z = { shade: 1402, card: 1403, nav: 1404 } as const;

// ---------------------------------------------------------------------------
// Course / tour copy context — published by the pages that already hold the
// data, so the card never reads anything itself.
// ---------------------------------------------------------------------------
let courseContext: { courseId: string; shortName: string; roundsTracked: number | null } | null = null;
let tourContext: { liveEventName: string | null } | null = null;

export function setGuestCourseContext(ctx: typeof courseContext): void {
  courseContext = ctx;
}

export function getGuestCourseContext(courseId: string) {
  return courseContext && courseContext.courseId === courseId ? courseContext : null;
}

export function setGuestTourContext(ctx: typeof tourContext): void {
  tourContext = ctx;
}

export function getGuestTourContext() {
  return tourContext;
}

// ---------------------------------------------------------------------------
// Test reset
// ---------------------------------------------------------------------------
export function resetGuestGateState(): void {
  lockedSurfaces.clear();
  cardRequest = null;
  courseContext = null;
  tourContext = null;
  openCourseSheets = 0;
  emit();
  sheetListeners.forEach((fn) => fn());
}
