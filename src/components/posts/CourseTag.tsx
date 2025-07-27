
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
      className={`inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm hover:bg-white/30 transition-colors shadow-lg ${className}`}
      style={{ borderRadius: '8px' }}
    >
      <span className="font-medium">{courseName}</span>
      {courseLocation && (
        <span className="ml-1 text-white/80">• {courseLocation}</span>
      )}
    </button>
  );
};

export default CourseTag;
