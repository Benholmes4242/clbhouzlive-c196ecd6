/**
 * shortCourseName — the Your courses list's compact course name (YC1 §5).
 *
 * Splits "Club (Course)" or "Club-Course" / "Club - Course" into club and
 * course parts, strips a trailing "Golf Club" / "Golf Course" /
 * "Golf Centre" / "GC" from the club (only when something is left) and a
 * trailing " Course" from the course part, then joins as "Club · Course" —
 * or just the club when there is no course part.
 *
 * Pure: no locale, no date, no DOM. Examples pinned by yc1YourCourses.test.
 */

const CLUB_SUFFIX = /\s+(?:Golf Club|Golf Course|Golf Centre|GC)$/i;
const COURSE_SUFFIX = /\s+Course$/i;

/** Strip a trailing club suffix, but never to an empty string. */
function stripClubSuffix(club: string): string {
  const stripped = club.replace(CLUB_SUFFIX, '').trim();
  return stripped.length > 0 ? stripped : club;
}

export function shortCourseName(fullName: string): string {
  const name = (fullName ?? '').trim();
  if (!name) return '';

  let club = name;
  let course: string | null = null;

  // "Club (Course)" — parenthesised course part wins over a hyphen split.
  const paren = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (paren) {
    club = paren[1].trim();
    course = paren[2].trim();
  } else {
    // "Club-Course" or "Club - Course": split on the FIRST hyphen/dash.
    const dash = name.match(/^(.*?)\s*[-–]\s*(.*)$/);
    if (dash && dash[1].trim() && dash[2].trim()) {
      club = dash[1].trim();
      course = dash[2].trim();
    }
  }

  const clubShort = stripClubSuffix(club);
  if (!course) return clubShort;

  const courseShort = course.replace(COURSE_SUFFIX, '').trim() || course;
  return `${clubShort} · ${courseShort}`;
}
