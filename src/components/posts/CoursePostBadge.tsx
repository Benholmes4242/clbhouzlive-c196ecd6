
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}`);
  };

  // Truncate to 4 words on mobile clubhouse only
  const truncateToFourWords = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(' ') + '...';
  };

  const displayName = (isMobile && isClubhouse) ? truncateToFourWords(course.name) : course.name;

  return (
    <div 
      className={`flex items-center cursor-pointer bg-transparent backdrop-blur-[1px] border border-white/25 rounded-full px-0.5 py-0 text-white shadow-lg shadow-black/10 ${className}`}
      onClick={handleCourseClick}
    >
      <MapPin className={`${isClubhouse ? 'h-5 w-5' : 'h-4 w-4'} mr-0.5 text-white`} />
      <span className="hover:underline text-base font-medium">{displayName}</span>
    </div>
  );
};

export default CoursePostBadge;
