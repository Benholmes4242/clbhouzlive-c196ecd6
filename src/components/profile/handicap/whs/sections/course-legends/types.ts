export interface CourseSelection {
  courseId: string;
  courseName: string;
  courseRegion: string | null;
  courseCountry: string | null;
  courseType: string | null;
}

export type WindowToggleVariant = 'dark' | 'light';
