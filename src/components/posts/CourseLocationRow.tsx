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
 * Formats location text matching Course Details page intent:
 * {Course Name}, {Region/State or Sub-country}, {Country}
 *
 * Hard rules:
 * - NEVER render the literal string "Unknown" (case-insensitive)
 * - If we don't have real location context, hide the entire row (no pin)
 */
const isMeaningfulPart = (value?: string | null): value is string => {
  const v = (value ?? '').trim();
  if (!v) return false;
  if (v.toLowerCase() === 'unknown') return false;
  return true;
};

/**
 * Location format (final spec):
 * - "CourseName, Country, Region" (preferred)
 * - If no region: "CourseName, Country, SubCountry"
 * - If neither region nor sub_country: hide row entirely
 */
const formatLocationText = (course: CourseInfo): string => {
  const courseName = isMeaningfulPart(course.name) ? course.name.trim() : null;
  const country = isMeaningfulPart(course.country) ? course.country.trim() : null;
  const region = isMeaningfulPart(course.region) ? course.region.trim() : null;
  const subCountry = isMeaningfulPart(course.sub_country) ? course.sub_country.trim() : null;

  // Must have course name
  if (!courseName) return '';

  // Must have country + (region OR sub_country)
  if (!country) return '';

  let locationPart: string | null = null;
  if (region) {
    locationPart = region;
  } else if (subCountry) {
    locationPart = subCountry;
  }

  if (!locationPart) return '';

  // Build: "CourseName, Country, Region/SubCountry"
  // De-dupe if country === region/subCountry
  const parts = [courseName, country];
  if (locationPart !== country) {
    parts.push(locationPart);
  }

  return parts.join(', ');
};

/**
 * Renders the "📍 Played at …" row.
 *
 * - Never renders "Unknown" (hides entirely)
 * - Entire row is clickable CTA navigating to course page
 */
const CourseLocationRow: React.FC<CourseLocationRowProps> = ({
  course,
  className,
  isDark = false,
  showChevron = true,
  onClick,
}) => {
  const navigate = useNavigate();

  // Hide entirely if missing data or only "Unknown" parts
  if (!course || !isMeaningfulPart(course.name)) return null;

  const locationText = formatLocationText(course);
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
          "text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
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
