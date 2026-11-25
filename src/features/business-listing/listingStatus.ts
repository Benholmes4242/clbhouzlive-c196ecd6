/** Brief 24B — business_accounts.listing_status. clbhouz alone changes it:
 * new Golf Clubs start 'pending', approve_course_claim sets 'live',
 * reject_course_claim sets 'rejected'. RLS hides non-live rows from everyone
 * but the team, creator and admins, so a non-live row reaching the client is
 * always the viewer's own. A missing value is treated as live (legacy rows). */
export type ListingStatus = 'pending' | 'rejected' | 'live';
export function listingStatusOf(row: { listing_status?: string | null } | null | undefined): ListingStatus {
  const s = row?.listing_status;
  return s === 'pending' || s === 'rejected' ? s : 'live';
}
export const isListingLive = (row: { listing_status?: string | null } | null | undefined) => listingStatusOf(row) === 'live';

/** Brief 25 B5: the database refuses acts by a not-live club with 42501 and a
 * readable message. Returns that message for the normal error toast, or null. */
const NOT_LIVE_PREFIXES = ['This club is still being checked', "This club isn't open yet"];
export function notLiveErrorMessage(err: unknown): string | null {
  const e = err as { code?: string; message?: string } | null | undefined;
  if (!e || e.code !== '42501' || typeof e.message !== 'string') return null;
  return NOT_LIVE_PREFIXES.some((p) => e.message!.startsWith(p)) ? e.message : null;
}
