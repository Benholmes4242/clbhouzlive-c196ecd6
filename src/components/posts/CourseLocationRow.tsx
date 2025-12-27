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

const formatLocationText = (course: CourseInfo): string => {
  const parts: string[] = [];

  // Course name is required
  if (isMeaningfulPart(course.name)) {
    parts.push(course.name.trim());
  }

  // For GB&I and Continental Europe, prefer sub_country (e.g., "England", "Portugal")
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    if (isMeaningfulPart(course.sub_country)) {
      parts.push(course.sub_country.trim());
    } else if (isMeaningfulPart(course.region) && course.region !== course.country) {
      parts.push(course.region.trim());
    }
    // Intentionally do NOT add country label for these umbrella regions
  } else {
    if (isMeaningfulPart(course.region) && course.region !== course.country) {
      parts.push(course.region.trim());
    }
    if (isMeaningfulPart(course.country)) {
      parts.push(course.country.trim());
    }
  }

  // Hide if we only have the name (no real location context)
  if (parts.length < 2) return '';

  // De-dupe adjacent duplicates
  const deduped: string[] = [];
  for (const p of parts) {
    if (deduped[deduped.length - 1] !== p) deduped.push(p);
  }

  return deduped.join(', ');
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
