/**
 * Navigation utility for use outside React component context
 * Allows toast actions and other non-component code to trigger React Router navigation
 */

import { NavigateFunction } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;

/**
 * Store the navigate function reference from React Router
 * Called once during app initialization
 */
export function setNavigateRef(navigate: NavigateFunction) {
  navigateRef = navigate;
}

/**
 * Navigate to a path using React Router (SPA navigation)
 * Falls back to window.location.href if navigate ref not set
 */
export function appNavigate(to: string) {
  if (navigateRef) {
    navigateRef(to);
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
