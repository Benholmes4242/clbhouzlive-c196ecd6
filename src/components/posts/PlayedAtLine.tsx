import React from 'react';
import CourseLocationRow from './CourseLocationRow';

interface PlayedAtLineProps {
  courseId?: string | null;
  courseName?: string | null;
  regionText?: string | null;
  className?: string;
  isDark?: boolean;
}

/**
 * Renders the "📍 Played at [Course Name], [Region]" line
 * Now uses the unified CourseLocationRow component for consistency
 */
const PlayedAtLine: React.FC<PlayedAtLineProps> = ({
  courseId,
  courseName,
  regionText,
  className = '',
  isDark = false
}) => {
  if (!courseName) return null;

  return (
    <CourseLocationRow
      course={{
        id: courseId,
        name: courseName,
        country: regionText, // regionText is typically the country/region
      }}
      isDark={isDark}
      showChevron={false}
      className={className}
    />
  );
};

export default PlayedAtLine;
