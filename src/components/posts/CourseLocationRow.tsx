import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinned, ChevronRight } from 'lucide-react';
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
 * - "SubCountry, Region" or "Country, Region" (preferred)
 * - If no region: just show country or sub_country
 */
const formatLocationText = (course: CourseInfo): string | null => {
  const country = isMeaningfulPart(course.country) ? course.country.trim() : null;
  const region = isMeaningfulPart(course.region) ? course.region.trim() : null;
  const subCountry = isMeaningfulPart(course.sub_country) ? course.sub_country.trim() : null;

  // Build location string: prefer "SubCountry, Region" or "Country"
  const parts: string[] = [];
  if (subCountry) parts.push(subCountry);
  if (region && region !== subCountry) parts.push(region);
  if (!parts.length && country) parts.push(country);

  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Renders the course location in card-style format:
 * - MapPin icon on left
 * - Course name (bold) on first line
 * - Location (muted) on second line
 * - Clickable, navigates to course page
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
        "flex items-start gap-2 py-2.5 transition-all text-left w-full",
        isClickable && "cursor-pointer active:scale-[0.98] active:opacity-80",
        !isClickable && "cursor-default",
        className
      )}
    >
      <MapPinned 
        className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isDark ? "text-white/60" : "text-muted-foreground"
        )} 
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span 
          className={cn(
            "font-semibold text-[13px] leading-tight truncate",
            isDark ? "text-white/90" : "text-foreground"
          )}
        >
          {course.name}
        </span>
        {locationText && (
          <span 
            className={cn(
              "text-xs leading-tight truncate",
              isDark ? "text-white/60" : "text-muted-foreground"
            )}
          >
            {locationText}
          </span>
        )}
      </div>
      {showChevron && isClickable && (
        <ChevronRight 
          className={cn(
            "h-4 w-4 flex-shrink-0 mt-0.5",
            isDark ? "text-white/40" : "text-muted-foreground/60"
          )} 
        />
      )}
    </button>
  );
};

export default React.memo(CourseLocationRow);
