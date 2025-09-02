
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
  const [needsTruncation, setNeedsTruncation] = useState(false);

  // Truncate to 4 words when text is too long
  const truncateToFourWords = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(' ') + '...';
  };

  // Check if text needs truncation based on available screen width
  React.useEffect(() => {
    if (!isClubhouse) {
      setNeedsTruncation(false);
      return;
    }

    const checkTextWidth = () => {
      // Create a temporary element to measure text width
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.fontSize = '16px';
      tempElement.style.fontWeight = '500';
      tempElement.style.fontFamily = getComputedStyle(document.body).fontFamily;
      tempElement.textContent = course.name;
      document.body.appendChild(tempElement);
      
      const textWidth = tempElement.offsetWidth;
      document.body.removeChild(tempElement);
      
      // Calculate available width (screen width minus padding and icon space)
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth - 120; // Account for padding, icon, and margins
      
      setNeedsTruncation(textWidth > availableWidth);
    };

    checkTextWidth();
    window.addEventListener('resize', checkTextWidth);
    return () => window.removeEventListener('resize', checkTextWidth);
  }, [course.name, isClubhouse]);

  const displayName = (needsTruncation && !showFullName) ? truncateToFourWords(course.name) : course.name;

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If text is truncated, first click shows full name, second click navigates
    if (needsTruncation && !showFullName) {
      setShowFullName(true);
      return;
    }
    
    // Navigate to course page
    navigate(`/courses/${course.id}`);
  };

  return (
    <div 
      className={`flex items-center cursor-pointer bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-1 text-white shadow-lg hover:bg-white/20 transition-all duration-300 rounded-lg ${className}`}
      onClick={handleCourseClick}
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <span className="text-base font-medium">{displayName}</span>
    </div>
  );
};

export default CoursePostBadge;
