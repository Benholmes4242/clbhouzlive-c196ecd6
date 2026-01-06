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
 * Uses region + country (matches Clubhouse feed format).
 * 
 * Example: "Asia" or "Britain & Ireland"
 */
export function formatCourseLocationShort(course: Course | null | undefined): string {
  if (!course) return '';
  
  // Prefer region, then country - matches Clubhouse format
  const region = course.region;
  const country = course.country;
  
  // If region and country are the same (e.g., "Asia"), just use one
  if (region && country && region !== country) {
    return `${region}, ${country}`.replace(/^, |, $/g, '');
  }
  
  // Fallback to region or country
  return region || country || '';
}
