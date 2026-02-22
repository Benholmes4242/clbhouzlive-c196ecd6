import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import type { CollegeMedia } from '../hooks/useCollegeMedia';

interface CollegeLogoProps {
  college: CollegeMedia | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Size classes for college logos
 * xs: 12px - tiny inline
 * sm: 16px - leaderboards, search results
 * md: 20px - player list rows
 * lg: 24px - user profile badges
 * xl: 32px - player/user profile headers
 */
const SIZE_CLASSES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Displays a college logo from R2.
 * Returns null if no college or no logo available.
 */
export function CollegeLogo({ college, size = 'sm', className }: CollegeLogoProps) {
  const logoUrl = getCollegeLogoUrl(college?.college_name);
  if (!logoUrl) {
    return null;
  }
  
  return (
    <img
      src={logoUrl}
      alt={college?.short_name || college?.college_name || ''}
      className={cn(
        SIZE_CLASSES[size],
        'object-contain shrink-0 rounded-sm',
        className
      )}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

interface CollegeDisplayProps {
  collegeName: string;
  college: CollegeMedia | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLogo?: boolean;
  /** When true, wraps in a subtle pill background */
  asBadge?: boolean;
  className?: string;
}

/**
 * Displays college name with optional logo inline.
 * Falls back to just text if no logo available.
 * 
 * Usage:
 * - Player list: <CollegeDisplay size="md" />
 * - Leaderboards: <CollegeDisplay size="sm" />
 * - Profile header: <CollegeDisplay size="xl" asBadge />
 */
export function CollegeDisplay({ 
  collegeName, 
  college, 
  size = 'sm',
  showLogo = true,
  asBadge = false,
  className 
}: CollegeDisplayProps) {
  const displayName = college?.short_name || college?.college_name || collegeName;
  const logoUrl = getCollegeLogoUrl(college?.college_name || collegeName);
  const hasLogo = showLogo && !!logoUrl;
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 truncate',
        asBadge && 'bg-muted/50 rounded-full px-2 py-0.5',
        className
      )}
    >
      {hasLogo && (
        <CollegeLogo college={college} size={size} />
      )}
      <span className="truncate text-muted-foreground">{displayName}</span>
    </span>
  );
}

/**
 * Logo-only variant for tight spaces (tooltips, small cards).
 * Returns null if no logo available.
 */
export function CollegeLogoOnly({ 
  college, 
  size = 'md',
  className
}: Omit<CollegeLogoProps, 'className'> & { className?: string }) {
  return <CollegeLogo college={college} size={size} className={className} />;
}
