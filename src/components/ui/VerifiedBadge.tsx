import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { businessVerificationCopy } from '@/lib/businessVerificationCopy';

interface VerifiedBadgeProps {
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether this is a business badge (green) or personal (blue) */
  variant?: 'business' | 'personal';
  /** Verification status for tooltip copy */
  status?: 'verified' | 'pending' | 'rejected';
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const variantClasses = {
  business: 'text-emerald-500',
  personal: 'text-blue-500',
};

const statusClasses = {
  verified: 'text-emerald-500',
  pending: 'text-amber-500',
  rejected: 'text-muted-foreground',
};

export function VerifiedBadge({ 
  size = 'md', 
  showTooltip = true, 
  className,
  variant = 'business',
  status = 'verified',
}: VerifiedBadgeProps) {
  const colorClass = status === 'verified' 
    ? variantClasses[variant] 
    : statusClasses[status];

  const badge = (
    <BadgeCheck 
      className={cn(sizeClasses[size], colorClass, className)} 
      aria-label="Verified"
    />
  );

  if (!showTooltip) {
    return badge;
  }

  const tooltipCopy = businessVerificationCopy.badgeTooltips[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        <p className="font-medium">{tooltipCopy.title}</p>
        <p className="text-muted-foreground">{tooltipCopy.body}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default VerifiedBadge;
