interface Course {
  country?: string | null;
  sub_country?: string | null;
  region?: string | null;
}

/**
 * Formats the course location in City/Region, Country format.
 * Matches business location display rules.
 * 
 * Order: most local (sub_country or region), then country
 * Example: "Northern Ireland, Britain & Ireland" or "California, United States"
 */
export function formatCourseLocation(course: Course | null | undefined): string {
  if (!course) return '';

  // Get the most local part (sub_country preferred, then region)
  const localPart = course.sub_country || course.region;
  const countryPart = course.country;

  if (localPart && countryPart) {
    return `${localPart}, ${countryPart}`;
  }
  
  // Fallback to whatever we have
  return localPart || countryPart || '';
}

/**
 * Formats the course location in short format for overlays.
 * Prefer the broadest label (country), falling back to region/sub_country.
 *
 * Examples: "Asia", "Britain & Ireland"
 */
export function formatCourseLocationShort(course: Course | null | undefined): string {
  if (!course) return '';

  const country = (course.country ?? '').trim();
  if (country) return country;

  const region = (course.region ?? '').trim();
  if (region) return region;

  const subCountry = (course.sub_country ?? '').trim();
  return subCountry;
}

