/**
 * RecentlyAddedSection - Shows recently played Top 100 courses
 * Light theme version
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
    className="w-full flex items-center gap-3 py-3 border-b text-left transition-colors hover:bg-black/[0.02]"
    style={{ borderColor: 'var(--quest-divider)' }}
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
      <div className="flex items-center justify-between mb-4 px-1">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--quest-text-secondary)' }}
        >
          Recently Added
        </h2>
        <button
          onClick={() => navigate('/profile?tab=courses')}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: 'var(--quest-accent-green)' }}
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--quest-surface)',
          border: hasGoldTrim 
            ? '1px solid rgba(210, 180, 97, 0.25)' 
            : '1px solid var(--quest-stroke)',
          boxShadow: hasGoldTrim 
            ? '0 0 15px rgba(210, 180, 97, 0.1)' 
            : 'var(--quest-shadow)',
        }}
      >
        {courses.map((course) => (
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
