// Shared rules for when the global CompactHeader is shown.
// IMPORTANT: Keep this in sync with layout expectations (PageRoot offset, etc.)

export const GLOBAL_HEADER_EXCLUDED_ROUTES = [
  '/',
  '/clubhouse',
  '/auth',
  '/auth/callback',
  '/auth/check-email',
  '/auth/verified',
  '/auth/reset-password',
  '/verified',
  '/signup',
  '/onboarding',
  '/create-moment',
  '/business/intro',
  '/business/create',
  '/business/success',
  '/messages',
  '/profile',
  '/achievements',
] as const;

export const GLOBAL_HEADER_EXCLUDED_PREFIXES = [
  '/admin',
  '/hub',
  '/echo', // Echo AI page - immersive full-screen experience
  '/courses/', // Course detail pages - has its own back navigation
  '/messages/', // Chat view has its own header
  '/profile/', // User profile pages - immersive full-bleed hero
  '/top100/', // Individual region top 100 pages - immersive layout
  '/tourhub', // Tour Hub - all tabs & sub-pages are fully immersive
  '/tour', // Tour Hub alias
  '/discover/explore/region/', // Individual region pages - immersive hero
  '/achievements/', // Other user's quest page - has own back nav
] as const;

/**
 * Special routes that are conditionally excluded based on query params
 * Currently no conditional exclusions — Tour Hub is fully excluded via prefix.
 */
export function isConditionallyExcluded(_pathname: string, _searchParams: URLSearchParams): boolean {
  return false;
}

/**
 * Business profile page: /business/:idOrSlug (but NOT /business/:id/edit, /business/:id/insights, etc.)
 * Matches /business/some-slug but not /business/some-id/edit
 */
function isBusinessProfilePage(pathname: string): boolean {
  if (!pathname.startsWith('/business/')) return false;
  const segments = pathname.replace(/\/$/, '').split('/');
  // /business/:idOrSlug = exactly 3 segments: ['', 'business', ':idOrSlug']
  return segments.length === 3;
}

export function isGlobalHeaderExcluded(pathname: string) {
  const isExcludedExact = (GLOBAL_HEADER_EXCLUDED_ROUTES as readonly string[]).some(
    (route) => pathname === route
  );

  const isExcludedPrefix = (GLOBAL_HEADER_EXCLUDED_PREFIXES as readonly string[]).some(
    (prefix) => pathname.startsWith(prefix)
  );

  return isExcludedExact || isExcludedPrefix || isBusinessProfilePage(pathname);
}

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
  '/top100/',         // Region Top 100 pages
  '/business/',       // Business profile pages (immersive hero)
  '/discover/explore/region/', // Region pages
] as const;

export const IMMERSIVE_EXACT_ROUTES = [
  '/',
  '/clubhouse',
] as const;

export function isImmersiveRoute(pathname: string): boolean {
  const exactMatch = (IMMERSIVE_EXACT_ROUTES as readonly string[]).some(
    (r) => pathname === r
  );
  const prefixMatch = (IMMERSIVE_ROUTE_PREFIXES as readonly string[]).some(
    (p) => pathname.startsWith(p)
  );
  return exactMatch || prefixMatch;
}
