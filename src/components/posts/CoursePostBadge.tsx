
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
  isClubhouse?: boolean;
}

const CoursePostBadge = ({ course, className = "", isClubhouse = false }: CoursePostBadgeProps) => {
  const navigate = useNavigate();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}`);
  };

  return (
    <div 
      className={`flex items-center cursor-pointer bg-transparent backdrop-blur-[2px] border border-white/20 rounded-full px-3 py-1.5 text-white shadow-lg shadow-black/10 ${className}`}
      onClick={handleCourseClick}
    >
      <MapPin className={`${isClubhouse ? 'h-5 w-5' : 'h-4 w-4'} mr-1.5 text-white`} />
      <span className={`hover:underline ${isClubhouse ? 'text-base' : 'text-sm'} font-medium`}>{course.name}</span>
    </div>
  );
};

export default CoursePostBadge;
