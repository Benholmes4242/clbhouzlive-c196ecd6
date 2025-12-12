import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether this is a business badge (green) or personal (blue) */
  variant?: 'business' | 'personal';
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

export function VerifiedBadge({ 
  size = 'md', 
  showTooltip = true, 
  className,
  variant = 'business'
}: VerifiedBadgeProps) {
  const badge = (
    <BadgeCheck 
      className={cn(sizeClasses[size], variantClasses[variant], className)} 
      aria-label="Verified"
    />
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p className="font-medium">Official Business</p>
        <p className="text-muted-foreground">Verified by Clbhouz</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default VerifiedBadge;
