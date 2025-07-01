
import React from 'react';
import { MapPin } from 'lucide-react';

interface GolfCoursePinProps {
  courseName: string;
  className?: string;
}

const GolfCoursePin = ({ courseName, className = '' }: GolfCoursePinProps) => {
  return (
    <div className={`absolute top-2 right-2 z-10 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 ${className}`}>
      <MapPin size={12} />
      <span className="truncate max-w-24">{courseName}</span>
    </div>
  );
};

export default GolfCoursePin;
