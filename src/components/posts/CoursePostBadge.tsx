
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
    navigate(`/courses/${course.id}`);
  };

  return (
    <div 
      className={`flex items-center cursor-pointer ${className}`}
      onClick={handleCourseClick}
    >
      <MapPin className="h-4 w-4 mr-1.5 text-white" />
      <span className="hover:underline text-sm font-medium">{course.name}</span>
    </div>
  );
};

export default CoursePostBadge;
