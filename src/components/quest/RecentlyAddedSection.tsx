/**
 * RecentlyAddedSection - Premium record of recently played courses
 * Features: Clear row separation, enhanced styling
 */

import React, { useEffect, useState } from 'react';
import { Trophy, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

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
  index: number;
  onClick?: () => void;
}> = ({ course, index, onClick }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 py-3.5 text-left transition-colors quest-recent-row",
        !prefersReducedMotion && "quest-animate-fade-up"
      )}
      style={{ animationDelay: prefersReducedMotion ? '0ms' : `${400 + index * 60}ms` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ 
          background: 'rgba(210, 180, 97, 0.10)',
          border: '1px solid rgba(210, 180, 97, 0.18)',
        }}
      >
        <Trophy className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--quest-text-primary)' }}>
          {course.name}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: 'var(--quest-text-tertiary)' }}>
            {course.region}
          </p>
          <span className="text-xs" style={{ color: 'var(--quest-text-tertiary)', opacity: 0.5 }}>•</span>
          <span 
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ 
              background: 'rgba(110, 146, 119, 0.08)',
              color: 'var(--quest-accent-green)',
            }}
          >
            Added to Quest
          </span>
        </div>
      </div>
      {course.dateAdded && (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: 'var(--quest-text-tertiary)' }}>
          {course.dateAdded}
        </span>
      )}
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--quest-text-tertiary)' }} />
    </button>
  );
};

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({
  courses,
  hasGoldTrim = false,
  onCourseClick,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (courses.length === 0) return null;

  return (
    <section>
      <div 
        className={cn(
          "flex items-center justify-between mb-4 px-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up"
        )}
        style={{ animationDelay: '350ms' }}
      >
        <h2 className="quest-section-title">
          Recently Added
        </h2>
        <button
          onClick={() => navigate('/top100?tab=my-progress')}
          className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--quest-accent-green)' }}
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div
        className={cn(
          "rounded-xl overflow-hidden",
          isVisible && !prefersReducedMotion && "quest-animate-scale-in"
        )}
        style={{
          background: 'var(--quest-surface)',
          border: hasGoldTrim 
            ? '1px solid rgba(210, 180, 97, 0.2)' 
            : '1px solid var(--quest-stroke)',
          boxShadow: hasGoldTrim 
            ? 'var(--quest-shadow-glow)' 
            : 'var(--quest-shadow)',
          animationDelay: '380ms',
        }}
      >
        <div className="px-4">
          {courses.map((course, index) => (
            <RecentCourseRow
              key={course.id}
              course={course}
              index={index}
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
      </div>
    </section>
  );
};

export default RecentlyAddedSection;
