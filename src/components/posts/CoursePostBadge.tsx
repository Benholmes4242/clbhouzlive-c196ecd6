import React, { useState } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export interface CourseForBadge {
  id: string;
  name: string;
  country?: string;
  region?: string;
}

interface CoursePostBadgeProps {
  /** Single course (legacy) or array of courses */
  course?: CourseForBadge;
  courses?: CourseForBadge[];
  className?: string;
  isClubhouse?: boolean;
  variant?: 'overlay' | 'inline';
  maxDisplay?: number;
}

const CoursePostBadge = ({ 
  course, 
  courses: coursesProp,
  className = "", 
  isClubhouse = false,
  variant = 'overlay',
  maxDisplay = 1 
}: CoursePostBadgeProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [showFullName, setShowFullName] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  // Normalize to array - support both single course and courses array
  const courses = coursesProp || (course ? [course] : []);

  if (!courses || courses.length === 0) return null;

  const isOverlay = variant === 'overlay';

  // Truncate to 4 words when text is too long
  const truncateToFourWords = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(' ') + '...';
  };

  // Check if text needs truncation based on available screen width
  React.useEffect(() => {
    if (!isClubhouse || courses.length !== 1) {
      setNeedsTruncation(false);
      return;
    }

    const checkTextWidth = () => {
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.fontSize = '16px';
      tempElement.style.fontWeight = '500';
      tempElement.style.fontFamily = getComputedStyle(document.body).fontFamily;
      tempElement.textContent = courses[0].name;
      document.body.appendChild(tempElement);
      
      const textWidth = tempElement.offsetWidth;
      document.body.removeChild(tempElement);
      
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth - 120;
      
      setNeedsTruncation(textWidth > availableWidth);
    };

    checkTextWidth();
    window.addEventListener('resize', checkTextWidth);
    return () => window.removeEventListener('resize', checkTextWidth);
  }, [courses, isClubhouse]);

  const handleCourseClick = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    navigate(`/courses/${courseId}`);
  };

  // Single course - simple display
  if (courses.length === 1) {
    const singleCourse = courses[0];
    const displayName = (needsTruncation && !showFullName) 
      ? truncateToFourWords(singleCourse.name) 
      : singleCourse.name;

    const handleSingleCourseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // If text is truncated, first click shows full name, second click navigates
      if (needsTruncation && !showFullName) {
        setShowFullName(true);
        return;
      }
      
      navigate(`/courses/${singleCourse.id}`);
    };

    return (
      <div 
        className={`h-8 inline-flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-1 text-white shadow-lg hover:bg-white/20 transition-all duration-300 rounded-xl gap-1 ${className}`}
        onClick={handleSingleCourseClick}
        style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
      >
        <span className="text-sm font-medium">{displayName}</span>
      </div>
    );
  }

  // Multiple courses - show count with expandable list
  if (!expanded) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(true);
        }}
        className={`
          h-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer
          ${isOverlay 
            ? 'bg-white/10 backdrop-blur-2xl border border-white/20 text-white shadow-lg hover:bg-white/20' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
          ${className}
        `}
        style={isOverlay ? { backdropFilter: 'blur(40px) saturate(180%)' } : undefined}
      >
        <MapPin className={`w-3.5 h-3.5 ${isOverlay ? 'text-white' : 'text-gray-500'}`} />
        <span className="text-sm font-medium">
          {courses.length} courses
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ${isOverlay ? 'text-white/70' : 'text-gray-400'}`} />
      </button>
    );
  }

  // Expanded view - show all courses
  return (
    <div 
      className={`
        flex flex-col gap-1 p-2 rounded-xl
        ${isOverlay 
          ? 'bg-white/10 backdrop-blur-2xl border border-white/20' 
          : 'bg-gray-100'
        }
        ${className}
      `}
      style={isOverlay ? { backdropFilter: 'blur(40px) saturate(180%)' } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      {courses.map((c) => (
        <button
          key={c.id}
          onClick={(e) => handleCourseClick(e, c.id)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-left
            ${isOverlay 
              ? 'hover:bg-white/20 text-white' 
              : 'hover:bg-gray-200 text-gray-700'
            }
          `}
        >
          <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isOverlay ? 'text-white/70' : 'text-gray-500'}`} />
          <span className="text-sm font-medium truncate">
            {c.name}
          </span>
        </button>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(false);
        }}
        className={`text-xs mt-1 text-center ${isOverlay ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}
      >
        Show less
      </button>
    </div>
  );
};

export default CoursePostBadge;
