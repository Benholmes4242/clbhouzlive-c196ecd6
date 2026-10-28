/**
 * The ONE rule for whether a business profile displays opening hours:
 * show_opening_hours is true AND at least one day is set (closed, or an
 * open and close time). ClubVisiting renders by it and the business
 * home's profile completeness (CB68) counts by it, so they cannot disagree.
 */
export const OPENING_HOURS_DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const OPENING_HOURS_DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
export type OpeningHoursEntry = { open: string; close: string; closed: boolean };
// About keeps its historical separator; Visiting explicitly opts into the signed-off en dash.
export function formatOpeningHours(entry: OpeningHoursEntry, separator = ' - '): string {
  return entry.closed ? 'Closed' : `${entry.open}${separator}${entry.close}`;
}

export function displaysOpeningHours(business: {
  show_opening_hours?: boolean | null;
  opening_hours?: unknown;
}): boolean {
  const oh = (business.opening_hours || {}) as Record<string, { open?: string; close?: string; closed?: boolean } | undefined>;
  const hasContent = OPENING_HOURS_DAY_KEYS.some((k) => {
    const h = oh[k];
    return !!h && (h.closed === true || (!!h.open && !!h.close));
  });
  return business.show_opening_hours === true && hasContent;
}
