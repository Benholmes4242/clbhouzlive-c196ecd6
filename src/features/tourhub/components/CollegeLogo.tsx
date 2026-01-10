import { cn } from '@/lib/utils';
import type { CollegeMedia } from '../hooks/useCollegeMedia';

interface CollegeLogoProps {
  college: CollegeMedia | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Displays a college logo from the college_media table.
 * Returns null if no college or no logo available.
 */
export function CollegeLogo({ college, size = 'sm', className }: CollegeLogoProps) {
  if (!college?.logo_url) {
    return null;
  }
  
  return (
    <img
      src={college.logo_url}
      alt={college.short_name || college.college_name}
      className={cn(
        SIZE_CLASSES[size],
        'object-contain shrink-0 opacity-90',
        className
      )}
      loading="lazy"
    />
  );
}

interface CollegeDisplayProps {
  collegeName: string;
  college: CollegeMedia | null;
  size?: 'xs' | 'sm' | 'md';
  showLogo?: boolean;
  className?: string;
}

/**
 * Displays college name with optional logo inline.
 * Falls back to just text if no logo available.
 */
export function CollegeDisplay({ 
  collegeName, 
  college, 
  size = 'sm',
  showLogo = true,
  className 
}: CollegeDisplayProps) {
  const displayName = college?.short_name || college?.college_name || collegeName;
  
  return (
    <span className={cn('inline-flex items-center gap-1 truncate', className)}>
      {showLogo && college?.logo_url && (
        <CollegeLogo college={college} size={size} />
      )}
      <span className="truncate">{displayName}</span>
    </span>
  );
}
