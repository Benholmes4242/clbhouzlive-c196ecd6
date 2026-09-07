/**
 * ADMIN-ONLY EVENTS — events emitted from the admin console or a dev-only route.
 *
 * WHY THIS EXISTS. Admin events sit in the same table as member behaviour, so
 * they produce permanent false absences: a name only two staff can ever reach
 * reads as "no member has used this feature" forever, and it can trip the
 * stopped-firing alarm the moment those two people stop clicking. They are not
 * retired (the emitter is live and correct) and they are not gaps (nothing is
 * missing) — they answer a different question and belong behind their own
 * toggle.
 *
 * THE CONTRACT IS THE EXPLICIT MAP BELOW, one reason per name. The `admin_`
 * prefix is matched automatically as a CONVENIENCE ONLY — a name is a weak
 * contract, and a member-facing event that happens to start with `admin_`
 * (or an admin event that does not) must be settled by adding a line here.
 *
 * RULES
 *  - Add a name with the surface it fires from and why it is admin-only.
 *  - If an event turns out to be reachable by a member, DELETE the line.
 *  - Never use this file to hide a member-facing event that reads badly.
 */
export const ADMIN_EVENTS: Record<string, string> = {
  admin_screens_viewed:
    'Admin > Analytics > Screens. Fires only inside the admin console (Sep 2026).',
  admin_username_changed:
    'Admin member tools: staff renaming a member. No member-facing path (Sep 2026).',
};

/** True for an explicitly registered admin event, or the `admin_` convenience. */
export function isAdminEvent(name: string): boolean {
  return name in ADMIN_EVENTS || name.startsWith('admin_');
}

/**
 * The recorded reason, or a generic one for a prefix match. Prefix matches are
 * deliberately labelled as such so an unregistered name is visible on screen
 * and can be given a real line.
 */
export function adminEventReason(name: string): string | null {
  if (ADMIN_EVENTS[name]) return ADMIN_EVENTS[name];
  if (name.startsWith('admin_')) return 'Matched by the admin_ name prefix; not yet registered in ADMIN_EVENTS.';
  return null;
}
