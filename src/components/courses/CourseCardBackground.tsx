import React from 'react';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';

interface CourseCardBackgroundProps {
  courseId?: string;
  thumbnailImage?: string;
  courseName: string;
  disableLazyLoading?: boolean;
}

/**
 * No stock photograph stands in for a course (BRIEF_COURSES_PAGE_REBUILD §1c):
 * a missing or broken image becomes the deterministic gradient-plus-initials
 * fallback, swapped in place.
 */
const CourseCardBackground: React.FC<CourseCardBackgroundProps> = ({
  courseId,
  thumbnailImage,
  courseName,
}) => (
  <CourseImageFallback
    courseId={courseId ?? courseName}
    courseName={courseName}
    imageUrl={thumbnailImage ? `${thumbnailImage}?w=600&h=450&fit=crop&q=80` : null}
    style={{ position: 'absolute', inset: 0 }}
  />
  /* NO SCRIM HERE — CourseCard paints the canonical SCRIM_STANDOUT over
     this background (BRIEF_APP_WIDE_SCRIM §1.2). Two scrims stacked is the bug. */
);

export default React.memo(CourseCardBackground);
