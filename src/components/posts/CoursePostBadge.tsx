
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
      className={`
        relative flex items-center cursor-pointer rounded-2xl px-3 py-1.5 text-white 
        backdrop-blur-[20px] border border-white/30
        shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        bg-white/15 hover:bg-white/20 transition-all duration-200
        before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-radial before:from-white/10 before:via-transparent before:to-transparent
        before:from-[circle_at_top_left] before:pointer-events-none
        dark:bg-black/20 dark:border-white/20 dark:hover:bg-black/30
        ${className}
      `}
      onClick={handleCourseClick}
    >
      <MapPin className={`${isClubhouse ? 'h-5 w-5' : 'h-4 w-4'} mr-1.5 text-white`} />
      <span className={`hover:underline ${isClubhouse ? 'text-base' : 'text-sm'} font-medium`}>{course.name}</span>
    </div>
  );
};

export default CoursePostBadge;
