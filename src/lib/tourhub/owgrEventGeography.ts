/**
 * OWGR event country ↔ clbhouz course geography.
 *
 * Mirrors the live database matcher. `golf_courses.country` is a region
 * grouping, except the USA rule; every other event is checked against
 * `sub_country`. Blank event countries fail closed.
 */

export interface OwgrCourseGeography {
  sub_country: string | null | undefined;
  country: string | null | undefined;
}

const USA_EVENT_NAMES = new Set(['usa', 'united states', 'united states of america']);
const KOREA_EVENT_NAMES = new Set(['korea', 'republic of korea', 'south korea']);

export function owgrCountryMatches(
  eventCountry: string | null | undefined,
  course: OwgrCourseGeography,
): boolean {
  const event = eventCountry?.trim().toLowerCase() ?? '';
  if (!event) return false;

  if (USA_EVENT_NAMES.has(event)) return course.country === 'USA';
  if (KOREA_EVENT_NAMES.has(event)) return course.sub_country?.trim().toLowerCase() === 'south korea';

  return course.sub_country?.trim().toLowerCase() === event;
}

export function owgrGeoNote(
  eventCountry: string | null | undefined,
  course: OwgrCourseGeography,
): string | null {
  if (owgrCountryMatches(eventCountry, course)) return null;
  return `The event is in ${eventCountry?.trim() || 'an unknown country'}; this course is in ${course.sub_country?.trim() || 'an unknown country'}.`;
}
