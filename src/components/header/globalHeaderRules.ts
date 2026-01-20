// Shared rules for when the global CompactHeader is shown.
// IMPORTANT: Keep this in sync with layout expectations (PageRoot offset, etc.)

export const GLOBAL_HEADER_EXCLUDED_ROUTES = [
  '/',
  '/clubhouse',
  '/auth',
  '/auth/callback',
  '/auth/verified',
  '/signup',
  '/onboarding',
  '/create-moment',
  '/business/intro',
  '/business/create',
  '/business/success',
] as const;

export const GLOBAL_HEADER_EXCLUDED_PREFIXES = [
  '/admin',
  '/hub',
  '/courses/', // Course detail pages - has its own back navigation
] as const;

export function isGlobalHeaderExcluded(pathname: string) {
  const isExcludedExact = (GLOBAL_HEADER_EXCLUDED_ROUTES as readonly string[]).some(
    (route) => pathname === route
  );

  const isExcludedPrefix = (GLOBAL_HEADER_EXCLUDED_PREFIXES as readonly string[]).some(
    (prefix) => pathname.startsWith(prefix)
  );

  return isExcludedExact || isExcludedPrefix;
}
