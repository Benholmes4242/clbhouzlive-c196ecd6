/**
 * RecentlyAddedSection - Shows recently played Top 100 courses
 */

import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
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
    className="w-full flex items-center gap-3 py-3 border-b text-left hover:bg-white/5 transition-colors"
    style={{ borderColor: 'var(--dgp-divider)' }}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--dgp-glass-surface)' }}
    >
      <Trophy className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate" style={{ color: 'var(--dgp-text-primary)' }}>
        {course.name}
      </p>
      <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
        {course.region}
      </p>
    </div>
    {course.dateAdded && (
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--dgp-text-muted)' }}>
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
      <div className="flex items-center justify-between mb-4 px-1">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--dgp-text-secondary)' }}
        >
          Recently Added
        </h2>
        <button
          onClick={() => navigate('/top100?tab=my-progress')}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: 'var(--dgp-accent-green)' }}
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div
        className="dgp-glass rounded-xl p-4"
        style={{
          boxShadow: hasGoldTrim ? '0 0 20px rgba(200, 176, 106, 0.1)' : 'none',
          border: hasGoldTrim ? '1px solid rgba(200, 176, 106, 0.2)' : undefined,
        }}
      >
        {courses.map((course, index) => (
          <RecentCourseRow
            key={course.id}
            course={course}
            onClick={() => {
              if (onCourseClick) {
                onCourseClick(course);
              } else {
                navigate(`/courses/${course.id}`);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default RecentlyAddedSection;
