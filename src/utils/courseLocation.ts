interface Course {
  country?: string | null;
  sub_country?: string | null;
  region?: string | null;
}

/**
 * Formats the course location in a consistent order across the app.
 * Order: country, sub_country, region
 * Example: "Britain & Ireland, Northern Ireland, Down"
 */
export function formatCourseLocation(course: Course | null | undefined): string {
  if (!course) return '';

  const parts = [
    course.country,
    course.sub_country,
    course.region
  ].filter(Boolean);

  return parts.join(', ');
}
