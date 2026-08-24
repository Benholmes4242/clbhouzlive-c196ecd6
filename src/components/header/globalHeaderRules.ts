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
  '/explore',
  '/watch',
  '/watch/clips',
  '/watch/videos',
] as const;

export const LIGHT_IMMERSIVE_EXACT_ROUTES = [
  '/watch',
  '/watch/clips',
  '/watch/videos',
] as const;

/**
 * /manage/handicap serves TWO surfaces: the WHS connect flow (page owns its
 * own back + title, wash runs through the notch) and the CONNECTED manage
 * surface (keeps ManagePageShell's header). Immersive is therefore scoped by
 * state, not by path: the connect screen raises this flag while mounted.
 */
export const WHS_CONNECT_PATH = '/manage/handicap';
let whsConnectImmersive = false;

export function setWhsConnectImmersive(value: boolean): void {
  whsConnectImmersive = value;
}

export function isWhsConnectImmersive(): boolean {
  return whsConnectImmersive;
}

export function isLightImmersiveRoute(pathname: string): boolean {
  if (pathname === WHS_CONNECT_PATH && whsConnectImmersive) return true;
  return (LIGHT_IMMERSIVE_EXACT_ROUTES as readonly string[]).includes(pathname);
}


/**
 * Static segments that follow /business/ but are NOT a business identifier.
 * They look like a profile path by shape (3 segments) but are standard shell
 * pages, so they must be excluded by name.
 */
export const BUSINESS_RESERVED_SEGMENTS = new Set([
  'create',
  'success',
  'intro',
  'invite',
]);

/**
 * Business PROFILE only is immersive (hero bleed). All other /business/*
 * routes (create wizard, managed subpages, invite pages, follower lists)
 * are standard shell pages whose headers must sit below the notch.
 *
 * A profile path is exactly 3 segments after stripping a trailing slash AND
 * its third segment is not one of BUSINESS_RESERVED_SEGMENTS. Shape alone is
 * not enough: '/business/create' is also 3 segments.
 *
 * This is the single definition. The chrome-v2 registry profile rule calls
 * this function rather than re-deriving the test, so the two systems cannot
 * disagree — and cannot be made to disagree by reordering the registry.
 */
export function isBusinessProfilePath(pathname: string): boolean {
  if (!pathname.startsWith('/business/')) return false;
  const segs = pathname.replace(/\/$/, '').split('/');
  if (segs.length !== 3) return false;
  return !BUSINESS_RESERVED_SEGMENTS.has(segs[2].toLowerCase());
}


export function isImmersiveRoute(pathname: string): boolean {
  // The review composer is a plain light page, not a hero page — it must
  // never mount immersive (the post-mount flip caused device paint bugs).
  if (/^\/courses\/[^/]+\/rate\/?$/.test(pathname)) return false;
  // Connect flow only — the connected manage surface stays non-immersive.
  if (pathname === WHS_CONNECT_PATH) return whsConnectImmersive;
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

/**
 * NEAR-BLACK CANVAS ROUTES — Echo and Messages.
 *
 * These pages render a `position: fixed; inset: 0` root (`.ec-root`,
 * `.messages-root`) on #05070A, so they already bleed under the notch. What
 * painted the white band above them was ROUTE CHROME, not layout: the default
 * branch of applyRouteChrome gave them the light surface (#F8FAFC) on
 * html/body, the #safe-area-shield (fixed, z-index 55) and the native status
 * bar. Chrome for these routes must be the same near-black as the canvas.
 */
export const CANVAS_DARK_CANVAS = '#05070A';

export function isCanvasDarkRoute(pathname: string): boolean {
  return (
    pathname === '/echo' ||
    pathname.startsWith('/echo/') ||
    pathname === '/messages' ||
    pathname.startsWith('/messages/')
  );
}
