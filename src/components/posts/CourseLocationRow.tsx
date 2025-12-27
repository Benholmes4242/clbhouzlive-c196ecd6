import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseInfo {
  id?: string | null;
  name?: string | null;
  region?: string | null;
  country?: string | null;
  sub_country?: string | null;
  slug?: string | null;
}

interface CourseLocationRowProps {
  course: CourseInfo | null | undefined;
  className?: string;
  /** Dark mode styling */
  isDark?: boolean;
  /** Show chevron indicator on the right */
  showChevron?: boolean;
  /** Callback fired when row is clicked (in addition to navigation) */
  onClick?: () => void;
}

/**
 * Formats location text matching Course Details page format:
 * {Course Name}, {Region/State}, {Country}
 * 
 * Rules:
 * - For GB&I and Continental Europe, use sub_country (e.g., "England", "Portugal")
 * - Never show "Britain & Ireland" or "Continental Europe" directly
 * - Never show "Unknown"
 */
const formatLocationText = (course: CourseInfo): string => {
  const parts: string[] = [];
  
  // Add course name first
  if (course.name) {
    parts.push(course.name);
  }
  
  // For GB&I and Continental Europe, prefer sub_country
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    if (course.sub_country) {
      parts.push(course.sub_country);
    } else if (course.region && course.region !== course.country) {
      parts.push(course.region);
    }
    // Don't add "Britain & Ireland" or "Continental Europe" as country
  } else {
    // For other countries (USA, etc.)
    if (course.region && course.region !== course.country) {
      parts.push(course.region);
    }
    if (course.country) {
      parts.push(course.country);
    }
  }
  
  return parts.filter(Boolean).join(', ');
};

/**
 * Renders the "📍 Played at [Course Name], [Region], [Country]" row
 * 
 * Features:
 * - Single horizontal row with map pin + text
 * - Never renders "Unknown" - hides entirely if no data
 * - Entire row is clickable CTA navigating to course page
 * - Uses same formatter as Course Details page
 * - Subtle CTA styling with optional chevron
 */
const CourseLocationRow: React.FC<CourseLocationRowProps> = ({
  course,
  className,
  isDark = false,
  showChevron = true,
  onClick,
}) => {
  const navigate = useNavigate();
  
  // Hide entirely if no course name
  if (!course?.name) return null;
  
  const locationText = formatLocationText(course);
  
  // Don't render if we only have the course name (no location context)
  // Actually, we should still render even with just the name
  if (!locationText) return null;
  
  const courseIdentifier = course.slug || course.id;
  const isClickable = !!courseIdentifier;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Haptic feedback for mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }
    
    onClick?.();
    
    if (courseIdentifier) {
      navigate(`/courses/${courseIdentifier}`);
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        "flex items-center gap-1.5 py-1 transition-all",
        isClickable && "cursor-pointer active:opacity-70 hover:opacity-80",
        !isClickable && "cursor-default",
        className
      )}
    >
      <MapPin 
        className={cn(
          "h-3.5 w-3.5 flex-shrink-0",
          isDark ? "text-white/60" : "text-muted-foreground"
        )} 
      />
      <span 
        className={cn(
          "text-[13px] font-medium whitespace-nowrap",
          isDark ? "text-white/70" : "text-muted-foreground"
        )}
      >
        Played at{' '}
        <span 
          className={cn(
            "font-semibold",
            isDark ? "text-white/90" : "text-foreground"
          )}
        >
          {locationText}
        </span>
      </span>
      {showChevron && isClickable && (
        <ChevronRight 
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 ml-auto",
            isDark ? "text-white/40" : "text-muted-foreground/60"
          )} 
        />
      )}
    </button>
  );
};

export default React.memo(CourseLocationRow);
