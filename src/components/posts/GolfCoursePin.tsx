
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface GolfCoursePinProps {
  courseName: string;
  courseRegion?: string;
  className?: string;
}

const GolfCoursePin = ({ courseName, courseRegion, className = '' }: GolfCoursePinProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayText = courseRegion ? `${courseName} • ${courseRegion}` : courseName;

  return (
    <div 
      className={`absolute top-2 right-2 z-10 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? (
        // Expanded state - full location name
        <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 max-w-64">
          <MapPin size={14} />
          <span className="truncate font-medium">{displayText}</span>
        </div>
      ) : (
        // Default state - just the pin icon
        <div className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer">
          <MapPin size={16} />
        </div>
      )}
    </div>
  );
};

export default GolfCoursePin;
