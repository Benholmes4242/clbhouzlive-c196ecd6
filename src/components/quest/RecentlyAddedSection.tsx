/**
 * RecentlyAddedSection - Shows recently played Top 100 courses
 * Light theme version
 */

import React from 'react';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentCourse {
  id: string;
  name: string;
  region: string;
  dateAdded?: string;
}

interface RecentlyAddedSectionProps {
  courses: RecentCourse[];
  hasGoldTrim?: boolean;
  onCourseClick?: (course: RecentCourse) => void;
}

const RecentCourseRow: React.FC<{
  course: RecentCourse;
  onClick?: () => void;
}> = ({ course, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 py-3 min-h-[44px] text-left transition-opacity active:opacity-80 hover:bg-black/[0.02]"
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ 
        background: 'rgba(210, 180, 97, 0.12)',
        border: '1px solid rgba(210, 180, 97, 0.2)',
      }}
    >
      <Trophy className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate text-foreground">
        {course.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {course.region}
      </p>
    </div>
    {course.dateAdded && (
      <span className="text-xs flex-shrink-0 text-muted-foreground">
        {course.dateAdded}
      </span>
    )}
  </button>
);

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({
  courses,
  hasGoldTrim = false,
  onCourseClick,
}) => {
  const navigate = useNavigate();

  if (courses.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Recently Added
      </h2>

      {/* Rows - py-3 each, border-b dividers, no divider after last */}
      <div>
        {courses.map((course, index) => (
          <div key={course.id}>
            <RecentCourseRow
              course={course}
              onClick={() => {
                if (onCourseClick) {
                  onCourseClick(course);
                } else {
                  navigate(`/courses/${course.id}`);
                }
              }}
            />
            {index < courses.length - 1 && (
              <div className="h-px bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default RecentlyAddedSection;