/**
 * VENUE LABEL — CLUB FIRST, COURSE AFTER.
 *
 * BRIEF_TOUR_OVERVIEW_UPCOMING_HERO, ruling 4. The Sportradar feed sends the
 * venue as TWO fields: `venue_name` is the CLUB ("Medinah Country Club") and
 * `venue_course_name` is the course within it ("Course No. 3"). Several
 * surfaces preferred the course field and fell back to the club, so the
 * Presidents Cup read as being played at "Course No. 3" — a string that names
 * no place on its own.
 *
 * The rule: render the club, then the course after it where one exists. Club
 * alone where there is no course field. Course alone ONLY when there is no
 * club, which is a feed defect rather than a layout choice.
 *
 * This also makes what a member reads agree with what the venue backfill
 * matches on: auto-map-tournament-venues matches `sr_course_map.sr_venue_name`
 * against the CLUB field. Anything that displays the course alone is showing a
 * string the link was never made on.
 *
 * NOT A RESOLVER KEY. Image and course resolvers key on the raw club or course
 * value; do not feed them this composed label.
 */
const SEP = '\u00B7';

export function formatVenueLabel(
  club: string | null | undefined,
  course: string | null | undefined,
): string | null {
  const c = club?.trim() || null;
  const k = course?.trim() || null;
  if (c && k && k.toLowerCase() !== c.toLowerCase()) return `${c} ${SEP} ${k}`;
  return c ?? k ?? null;
}
