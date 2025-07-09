
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
  showFullName?: boolean; // true for fullscreen modals, false for index feed
}

const CoursePostBadge = ({ course, className = "", showFullName = false }: CoursePostBadgeProps) => {
  const navigate = useNavigate();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}`);
  };

  // Format the display name based on context
  const getDisplayName = () => {
    if (showFullName && course.region) {
      return `${course.name} (${course.region})`;
    }
    return course.name;
  };

  return (
    <div className={`${className}`}>
      <Badge
        variant="secondary"
        className="bg-black/40 text-white hover:bg-black/60 cursor-pointer transition-all duration-200 hover:shadow-sm px-3 py-1.5 rounded-full text-xs font-medium border-0 backdrop-blur-sm"
        onClick={handleCourseClick}
      >
        <MapPin className="h-4 w-4 mr-1 text-white" />
        <span className="hover:underline">{getDisplayName()}</span>
      </Badge>
    </div>
  );
};

export default CoursePostBadge;
