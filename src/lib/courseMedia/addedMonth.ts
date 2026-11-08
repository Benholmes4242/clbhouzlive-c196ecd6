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

/** GALLERY_CONTROLS §4 — the gallery credit's posted date: the day without a
 * leading zero, the three-letter month and the four-digit year, UTC. Read from
 * the post's createdAt, never the tag's added_at. */
export function postedDateLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).padStart(4, '0')}`;
}
