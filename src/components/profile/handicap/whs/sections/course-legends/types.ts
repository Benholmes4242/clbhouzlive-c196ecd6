export interface CourseSelection {
  courseId: string;
  courseName: string;
  courseRegion: string | null;
  courseCountry: string | null;
  courseType: string | null;
}

/**
 * Orphaned since 10 Sep 2026: its only consumers (the window toggle, crown
 * cabinet and You card) were deleted. Kept as a region inside a live file,
 * not swept with the file sweep.
 */
export type WindowToggleVariant = 'dark' | 'light';
