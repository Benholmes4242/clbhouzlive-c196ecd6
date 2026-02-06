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
  '/messages',
] as const;

export const GLOBAL_HEADER_EXCLUDED_PREFIXES = [
  '/admin',
  '/hub',
  '/echo', // Echo AI page - immersive full-screen experience
  '/courses/', // Course detail pages - has its own back navigation
  '/messages/', // Chat view has its own header
] as const;

/**
 * Special routes that are conditionally excluded based on query params
 * Tour Hub Overview should be headerless for immersive hero experience
 */
export function isConditionallyExcluded(pathname: string, searchParams: URLSearchParams): boolean {
  // Tour Hub Overview: /tourhub with no tab or tab=overview
  if (pathname === '/tourhub' || pathname === '/tour') {
    const tab = searchParams.get('tab');
    return !tab || tab === 'overview';
  }
  return false;
}

export function isGlobalHeaderExcluded(pathname: string) {
  const isExcludedExact = (GLOBAL_HEADER_EXCLUDED_ROUTES as readonly string[]).some(
    (route) => pathname === route
  );

  const isExcludedPrefix = (GLOBAL_HEADER_EXCLUDED_PREFIXES as readonly string[]).some(
    (prefix) => pathname.startsWith(prefix)
  );

  return isExcludedExact || isExcludedPrefix;
}
