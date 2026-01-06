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
    className="w-full flex items-center gap-3 py-3 text-left transition-colors hover:bg-black/[0.02]"
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
      <p className="text-sm font-medium truncate" style={{ color: 'var(--quest-text-primary)' }}>
        {course.name}
      </p>
      <p className="text-xs" style={{ color: 'var(--quest-text-tertiary)' }}>
        {course.region}
      </p>
    </div>
    {course.dateAdded && (
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--quest-text-tertiary)' }}>
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
      <div className="mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Recently Added
        </h2>
      </div>

      {/* No card wrapper - rows sit on bg-slate-50 with dividers */}
      <div className="space-y-0">
        {courses.map((course, index) => (
          <React.Fragment key={course.id}>
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
              <div className="h-px bg-slate-200/60" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default RecentlyAddedSection;
