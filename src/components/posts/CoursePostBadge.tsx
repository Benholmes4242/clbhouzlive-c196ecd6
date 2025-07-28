
import React, { useState } from 'react';
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
  const [showFullName, setShowFullName] = useState(false);

  // Truncate to 4 words on mobile clubhouse only
  const truncateToFourWords = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(' ') + '...';
  };

  const shouldTruncate = isMobile && isClubhouse;
  const isTruncated = shouldTruncate && course.name.split(' ').length > 4;
  const displayName = (shouldTruncate && !showFullName) ? truncateToFourWords(course.name) : course.name;

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Mobile behavior: first click shows full name, second click navigates
    if (isMobile && isClubhouse && isTruncated) {
      if (!showFullName) {
        setShowFullName(true);
        return;
      }
    }
    
    // Navigate to course page
    navigate(`/courses/${course.id}`);
  };

  return (
    <div 
      className={`flex items-center cursor-pointer bg-black/20 backdrop-blur-sm border border-black/20 px-3 py-1.5 text-white shadow-lg hover:bg-black/30 transition-colors rounded-full ${className}`}
      onClick={handleCourseClick}
    >
      <MapPin className={`${isClubhouse ? 'h-5 w-5' : 'h-4 w-4'} mr-0.5 text-white`} />
      <span className="text-base font-medium">{displayName}</span>
    </div>
  );
};

export default CoursePostBadge;
