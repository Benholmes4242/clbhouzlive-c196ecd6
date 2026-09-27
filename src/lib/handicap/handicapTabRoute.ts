/**
 * THE ONE PLACE THAT BUILDS THE HANDICAP TAB URL.
 *
 * The handicap surface is the fourth tab on the member's own profile. Every
 * legacy route (/handicap and its params, stored in delivered pushes and
 * gam_notification_outbox rows) redirects here, so the target string is built
 * once: set tab=handicap and carry every other param through UNCHANGED
 * (?compare, ?gam, ?badge, ?section, ?score, ?src, legacy ?sheet, ?subtab).
 * The profile page's own effects consume and strip their params.
 */
export function handicapTabRoute(
  params?: URLSearchParams | Record<string, string> | null,
): string {
  const next = new URLSearchParams(params ?? undefined);
  next.set('tab', 'handicap');
  return `/profile?${next.toString()}`;
}
