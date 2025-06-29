
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface CoursePostBadgeProps {
  course: GolfCourse;
  className?: string;
}

const CoursePostBadge = ({ course, className = "" }: CoursePostBadgeProps) => {
  const navigate = useNavigate();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to course-specific feed - for now using courses page
    // TODO: Implement course-specific feed page
    navigate(`/courses`);
  };

  return (
    <div className={`flex justify-center mb-3 ${className}`}>
      <Badge
        variant="secondary"
        className="bg-white/90 text-gray-800 hover:bg-white/100 cursor-pointer transition-all duration-200 hover:shadow-sm px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200/50 backdrop-blur-sm"
        onClick={handleCourseClick}
      >
        <MapPin className="h-3 w-3 mr-1.5 text-gray-600" />
        <span className="hover:underline">{course.name}</span>
        {course.region && (
          <span className="text-gray-500 ml-1">• {course.region}</span>
        )}
      </Badge>
    </div>
  );
};

export default CoursePostBadge;
