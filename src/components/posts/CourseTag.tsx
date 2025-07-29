
import React from 'react';

interface CourseTagProps {
  courseName: string;
  courseLocation?: string;
  onClick?: () => void;
  className?: string;
}

const CourseTag = ({ courseName, courseLocation, onClick, className = "" }: CourseTagProps) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-2xl border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300 shadow-lg ${className}`}
      style={{ borderRadius: '8px', backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <span className="font-medium">{courseName}</span>
      {courseLocation && (
        <span className="ml-1 text-white/80">• {courseLocation}</span>
      )}
    </button>
  );
};

export default CourseTag;
