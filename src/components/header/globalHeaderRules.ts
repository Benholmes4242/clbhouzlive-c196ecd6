// Route classification for status-bar / immersive-surface concerns.
// Header visibility now lives in features/chrome-v2/registry.ts.

/**
 * Routes whose hero media bleeds into the safe area.
 * On these routes, .app-shell background must be transparent
 * so no grey shows through while the hero mounts.
 */
export const IMMERSIVE_ROUTE_PREFIXES = [
  '/courses/',        // Course Detail pages
  '/profile',         // Own profile + /profile/:username
  '/profile/',
  '/tourhub',         // All Tour Hub pages
  '/tour',            // Tour alias
  
  '/discover/explore/region/', // Region pages
] as const;

export const IMMERSIVE_EXACT_ROUTES = [
  '/',
  '/clubhouse',
  '/courses',
  '/watch',
  '/watch/clips',
  '/watch/videos',
] as const;

export const LIGHT_IMMERSIVE_EXACT_ROUTES = [
  '/watch',
  '/watch/clips',
  '/watch/videos',
] as const;

export function isLightImmersiveRoute(pathname: string): boolean {
  return (LIGHT_IMMERSIVE_EXACT_ROUTES as readonly string[]).includes(pathname);
}

/**
 * Business PROFILE only is immersive (hero bleed). All other /business/*
 * routes (create wizard, managed subpages, invite pages, follower lists)
 * are standard shell pages whose headers must sit below the notch.
 *
 * Segment logic mirrors the chrome-v2 registry profile rule so the two
 * systems can never disagree: `/business/:idOrSlug` is exactly 3 segments
 * after stripping a trailing slash.
 */
function isBusinessProfilePath(pathname: string): boolean {
  if (!pathname.startsWith('/business/')) return false;
  return pathname.replace(/\/$/, '').split('/').length === 3;
}

export function isImmersiveRoute(pathname: string): boolean {
  // The review composer is a plain light page, not a hero page — it must
  // never mount immersive (the post-mount flip caused device paint bugs).
  if (/^\/courses\/[^/]+\/rate\/?$/.test(pathname)) return false;
  if (isBusinessProfilePath(pathname)) return true;
  const exactMatch = (IMMERSIVE_EXACT_ROUTES as readonly string[]).some(
    (r) => pathname === r
  );
  const prefixMatch = (IMMERSIVE_ROUTE_PREFIXES as readonly string[]).some(
    (p) => pathname.startsWith(p)
  );
  return exactMatch || prefixMatch;
}


/**
 * Dark-chrome routes = the charcoal launch/landing surfaces (Clubhouse).
 * Single source of truth for: html/body bg, status bar, bottom nav,
 * PageRoot status-bar styling, and pre-React shell seeding.
 *
 * The cold-launch chain (splash → shell → skeleton → feed) is all
 * `#15171F` on these routes so there is no perceptible colour transition.
 */
export const DARK_CHROME_ROUTES = ['/', '/clubhouse', '/auth', '/signup'] as const;

export function isDarkChromeRoute(pathname: string): boolean {
  return (DARK_CHROME_ROUTES as readonly string[]).includes(pathname)
    || pathname.startsWith('/auth/')
    || pathname.startsWith('/handicap');
}
