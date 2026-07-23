/**
 * Navigation utility for use outside React component context
 * Allows toast actions and other non-component code to trigger React Router navigation
 */

import { NavigateFunction, type Location, type NavigateOptions } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;
let currentLocationRef: Location | null = null;

function isReviewWizardRoute(to: string): boolean {
  const path = to.startsWith('http') ? new URL(to).pathname : to.split('?')[0].split('#')[0];
  return path.startsWith('/rate-course-v2/') || /^\/courses\/[^/]+\/rate\/?$/.test(path);
}

/**
 * Store the navigate function reference from React Router
 * Called once during app initialization
 */
export function setNavigateRef(navigate: NavigateFunction, location?: Location) {
  navigateRef = navigate;
  if (location) currentLocationRef = location;
}

/**
 * Navigate to a path using React Router (SPA navigation)
 * Falls back to window.location.href if navigate ref not set
 */
export function appNavigate(to: string, options?: NavigateOptions) {
  if (navigateRef) {
    const navigateOptions = options ?? (
      isReviewWizardRoute(to) && currentLocationRef && !isReviewWizardRoute(currentLocationRef.pathname)
        ? { state: { backgroundLocation: currentLocationRef } }
        : undefined
    );
    navigateRef(to, navigateOptions);
  } else {
    // Fallback to window.location if ref not set
    console.warn('[appNavigate] Navigate ref not set, using window.location');
    window.location.href = to;
  }
}

/**
 * Check if navigate ref is available
 */
export function isNavigateReady(): boolean {
  return navigateRef !== null;
}

/**
 * Safe back navigation with fallback for deep links.
 * If there's no prior history (e.g. user opened a shared link directly),
 * navigates to a fallback path instead of doing nothing or exiting the app.
 */
export function safeGoBack(navigate: NavigateFunction, fallbackPath: string) {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(fallbackPath, { replace: true });
  }
}
