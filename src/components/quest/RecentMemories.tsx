/**
 * RecentMemories - Past courses as reflective moments
 * Card-based, softer dividers, breathing room
 */

import React, { useEffect, useState } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface RecentCourse {
  id: string;
  name: string;
  region: string;
  dateAdded?: string;
}

interface RecentMemoriesProps {
  courses: RecentCourse[];
  onCourseClick?: (course: RecentCourse) => void;
}

const MemoryRow: React.FC<{
  course: RecentCourse;
  index: number;
  isLast: boolean;
  onClick?: () => void;
}> = ({ course, index, isLast, onClick }) => {
  const prefersReducedMotion = useReducedMotion();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-4 transition-colors hover:bg-black/[0.02] rounded-lg flex items-center gap-3",
        !prefersReducedMotion && "quest-animate-fade-up",
        !isLast && "border-b",
      )}
      style={{ 
        animationDelay: prefersReducedMotion ? '0ms' : `${500 + index * 60}ms`,
        borderColor: 'var(--quest-hairline)',
      }}
    >
      {/* Trophy icon - small */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(210, 180, 97, 0.08)',
          border: '1px solid rgba(210, 180, 97, 0.15)',
        }}
      >
        <Trophy 
          className="w-4 h-4" 
          style={{ color: 'var(--quest-accent-gold)' }} 
        />
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: 'var(--quest-text-primary)' }}
        >
          {course.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span 
            className="text-xs"
            style={{ color: 'var(--quest-text-tertiary)' }}
          >
            {course.region}
          </span>
          <span 
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ 
              background: 'rgba(110, 146, 119, 0.08)',
              color: 'var(--quest-accent-green)',
            }}
          >
            Added to your Quest
          </span>
        </div>
      </div>

      {/* Date */}
      {course.dateAdded && (
        <span 
          className="text-xs tabular-nums flex-shrink-0"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          {formatDate(course.dateAdded)}
        </span>
      )}

      <ChevronRight 
        className="w-4 h-4 flex-shrink-0" 
        style={{ color: 'var(--quest-text-tertiary)' }} 
      />
    </button>
  );
};

export const RecentMemories: React.FC<RecentMemoriesProps> = ({
  courses,
  onCourseClick,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCourseClick = (course: RecentCourse) => {
    if (onCourseClick) {
      onCourseClick(course);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  // Only show if there are courses
  if (courses.length === 0) {
    return null;
  }

  return (
    <section>
      <h2
        className={cn(
          "quest-section-title mb-4 px-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up"
        )}
        style={{ animationDelay: '450ms' }}
      >
        Recent Memories
      </h2>

      <div 
        className={cn(
          "rounded-2xl p-4",
          isVisible && !prefersReducedMotion && "quest-animate-scale-in"
        )}
        style={{
          background: 'var(--quest-card)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow)',
          animationDelay: '500ms',
        }}
      >
        <div>
          {courses.slice(0, 5).map((course, index) => (
            <MemoryRow
              key={course.id}
              course={course}
              index={index}
              isLast={index === Math.min(courses.length, 5) - 1}
              onClick={() => handleCourseClick(course)}
            />
          ))}
        </div>

        {courses.length > 5 && (
          <button
            onClick={() => navigate('/top100?tab=my-progress')}
            className="w-full mt-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{
              color: 'var(--quest-accent-green)',
              background: 'rgba(110, 146, 119, 0.06)',
            }}
          >
            View all memories
          </button>
        )}
      </div>
    </section>
  );
};

export default RecentMemories;
