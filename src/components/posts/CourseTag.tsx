
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
      className={`inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors ${className}`}
    >
      <span className="font-medium">{courseName}</span>
      {courseLocation && (
        <span className="ml-1 text-blue-600">• {courseLocation}</span>
      )}
    </button>
  );
};

export default CourseTag;
