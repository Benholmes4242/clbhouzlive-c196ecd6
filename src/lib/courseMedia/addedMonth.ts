/** BRIEF_HOLE_PANEL_CAROUSEL §2 — the month a shot was ADDED to clbhouz
 * (course_hole_media.added_at), shared by the Latest holes rail and the hole
 * walk panel caption/fullscreen credit. EXIF capture months stay with
 * holeWalk.ts (month chips and "across N months" keep using them).
 * UTC month from the fixed three-letter array plus the four-digit year. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function addedMonthLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).padStart(4, '0')}`;
}
