import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

/**
 * Verified business badge - subtle, prestigious, never loud.
 * Matches LinkedIn verified company aesthetic.
 */
export function VerifiedBadge({ 
  size = 'md', 
  showTooltip = true,
  className 
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badge = (
    <span
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        className
      )}
      aria-label="Verified business"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(sizeClasses[size])}
        aria-hidden="true"
      >
        {/* Circle background - muted slate/green */}
        <circle cx="12" cy="12" r="10" className="fill-emerald-500/15" />
        {/* Checkmark - solid emerald */}
        <path
          d="M8 12.5l2.5 2.5 5.5-5.5"
          className="stroke-emerald-600"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[200px] text-center"
        >
          <p className="font-medium text-sm">Verified business</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This profile has been reviewed and confirmed by Clbhouz.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
