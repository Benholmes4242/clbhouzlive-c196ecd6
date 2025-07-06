
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
    <div className={`${className}`}>
      <Badge
        variant="secondary"
        className="bg-black/40 text-white hover:bg-black/60 cursor-pointer transition-all duration-200 hover:shadow-sm px-3 py-1.5 rounded-full text-xs font-medium border-0 backdrop-blur-sm"
        onClick={handleCourseClick}
      >
        <MapPin className="h-3 w-3 mr-1 text-white" />
        <span className="hover:underline">{course.name}</span>
      </Badge>
    </div>
  );
};

export default CoursePostBadge;
