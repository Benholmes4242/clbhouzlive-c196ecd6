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
import { openGuestCard, surfaceForPath } from './guestGateStore';
import { trackGuestGateShown } from './guestAnalytics';

export function isGuestAllowedPath(pathname: string): boolean {
  if (!GUEST_BROWSING_ENABLED) return true;
  // Free-look surfaces.
  if (surfaceForPath(pathname) !== null) return true;
  // Post deep links.
  if (/^\/post\/[^/]+/.test(pathname)) return true;
  // Auth and first-sign-in.
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return true;
  if (pathname === '/welcome' || pathname === '/signup') return true;
  // Public legal / gate pages.
  if (pathname === '/delete-account' || pathname.startsWith('/legal')) return true;
  if (pathname === '/privacy' || pathname === '/terms') return true;
  if (pathname.startsWith('/gate') || pathname === '/join' || pathname === '/get-app') return true;
  return false;
}

/**
 * Mounted once above the routes. When a guest lands on a route outside the
 * free-look surfaces, the action card opens and the guest is returned to the
 * Clubhouse — the card, not the route, is the answer.
 */
export function GuestRouteGuard() {
  const isGuest = useIsGuest();
  const location = useLocation();
  const blocked = isGuest && !isGuestAllowedPath(location.pathname);

  useEffect(() => {
    if (!blocked) return;
    trackGuestGateShown({
      surface: surfaceForPath(location.pathname),
      trigger: 'action',
      action: 'other',
    });
    openGuestCard({ kind: 'action', surface: surfaceForPath(location.pathname), action: 'other' });
  }, [blocked, location.pathname]);

  if (!blocked) return null;
  return <Navigate to="/" replace />;
}

export default GuestRouteGuard;
