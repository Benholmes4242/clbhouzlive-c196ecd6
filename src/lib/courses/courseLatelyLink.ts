/**
 * Deep link to a course page's Lately section (BRIEF_WHATS_BEEN_PLAYED_V4 §3).
 * CourseLatelySection renders inside the course detail page's default 'course'
 * tab (CourseAboutTab). GolfClubView consumes `section=lately` once: it opens
 * the tab, waits for [data-course-lately="ready"], scrolls it under the
 * islands, then removes the param with replace.
 */
export const LATELY_TAB = 'course';
export const LATELY_SECTION = 'lately';
export const courseLatelyHref = (courseId: string) => `/courses/${courseId}?tab=${LATELY_TAB}&section=${LATELY_SECTION}`;
