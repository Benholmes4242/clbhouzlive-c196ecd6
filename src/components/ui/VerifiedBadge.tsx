import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  /** Size of the badge: sm (14px), md (16px), lg (18px), xl (20px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Placement context for styling adjustments */
  placement?: 'inline' | 'avatar-corner';
  /** Additional class names */
  className?: string;
}

const sizeConfig = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

/**
 * Unified Verified Badge - BadgeCheck icon in emerald green
 * 
 * Used across personal profiles, business profiles, notifications, and lists.
 * This is the ONLY verified badge component - no shields, no variations.
 */
export function VerifiedBadge({ 
  size = 'md', 
  placement = 'inline',
  className,
}: VerifiedBadgeProps) {
  const iconSize = sizeConfig[size];
  
  return (
    <BadgeCheck 
      size={iconSize}
      className={cn(
        'text-emerald-500 shrink-0',
        placement === 'avatar-corner' && 'drop-shadow-sm',
        className
      )}
      aria-label="Verified"
    />
  );
}

export default VerifiedBadge;
