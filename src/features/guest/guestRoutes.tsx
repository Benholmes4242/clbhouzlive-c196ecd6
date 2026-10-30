/**
 * GUEST ROUTE RULES (brief §5). A guest may browse the free-look surfaces —
 * Clubhouse, Explore, Courses, every course page, the Tour and its sub-pages —
 * plus /post/:postId deep links, auth, and the public legal/gate pages.
 * Anything else opens the action card on the current page instead of
 * navigating: in-app taps are gated at their entry points, and this guard
 * catches anything that still lands on a route a guest can't use.
 */
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GUEST_BROWSING_ENABLED } from './guestConfig';
import { useIsGuest } from './useIsGuest';
import { openGuestCard, surfaceForPath, type GuestAction } from './guestGateStore';
import { trackGuestGateShown } from './guestAnalytics';

export function isGuestAllowedPath(pathname: string): boolean {
  if (!GUEST_BROWSING_ENABLED) return true;
  // Free-look surfaces.
  if (surfaceForPath(pathname) !== null) return true;
  // Post deep links.
  if (/^\/post\/[^/]+/.test(pathname)) return true;
  // Auth only: anonymous guests must never enter onboarding.
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return true;
  // Public legal / gate pages.
  if (pathname === '/delete-account' || pathname.startsWith('/legal')) return true;
  if (pathname === '/privacy' || pathname === '/terms') return true;
  if (pathname.startsWith('/gate') || pathname === '/join' || pathname === '/get-app') return true;
  return false;
}

/** The action a blocked route stands for, so the card reads the right copy. */
export function guestActionForPath(pathname: string): GuestAction {
  if (/^\/courses\/[^/]+\/rate\/?$/.test(pathname) || pathname.startsWith('/rate-course')) return 'rate';
  if (pathname === '/profile' || pathname.startsWith('/edit-profile') || pathname === '/settings') return 'own_profile';
  if (pathname === '/manage/handicap' || pathname.startsWith('/connect')) return 'connect_handicap';
  if (pathname.startsWith('/messages') || pathname.startsWith('/messaging')) return 'message';
  if (pathname.startsWith('/business/create') || pathname.startsWith('/claim')) return 'claim_course';
  return 'other';
}

// The last route a guest was allowed on, so a blocked route opens the card
// "on the current page" — the guest is put back where they tapped.
let lastAllowedPath: string = '/';

/**
 * Mounted once above the routes. When a guest lands on a route outside the
 * free-look surfaces, the action card opens and the guest is returned to the
 * page they came from (the Clubhouse on a cold deep link) — the card, not
 * the route, is the answer.
 */
export function GuestRouteGuard() {
  const isGuest = useIsGuest();
  const location = useLocation();
  const blocked = isGuest && !isGuestAllowedPath(location.pathname);
  if (isGuest && !blocked) lastAllowedPath = location.pathname + location.search + location.hash;

  useEffect(() => {
    if (!blocked) return;
    const back = lastAllowedPath;
    const surface = surfaceForPath(back.split(/[?#]/)[0]);
    const action = guestActionForPath(location.pathname);
    trackGuestGateShown({ surface, trigger: 'action', action });
    openGuestCard({ kind: 'action', surface, action });
  }, [blocked, location.pathname]);

  if (!blocked) return null;
  return <Navigate to={lastAllowedPath} replace />;
}

export default GuestRouteGuard;
