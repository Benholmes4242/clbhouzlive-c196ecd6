import { CheckCircle } from 'lucide-react';
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
  sm: { disk: 'w-[14px] h-[14px]', icon: 'w-2 h-2' },
  md: { disk: 'w-4 h-4', icon: 'w-2.5 h-2.5' },
  lg: { disk: 'w-[18px] h-[18px]', icon: 'w-3 h-3' },
  xl: { disk: 'w-5 h-5', icon: 'w-3.5 h-3.5' },
};

/**
 * Unified Verified Badge - Frosted glass disk with green tick
 * Used across personal profiles, business profiles, notifications, and lists.
 */
export function VerifiedBadge({ 
  size = 'md', 
  placement = 'inline',
  className,
}: VerifiedBadgeProps) {
  const config = sizeConfig[size];
  
  return (
    <span
      className={cn(
        // Frosted glass disk
        'inline-flex items-center justify-center rounded-full',
        'bg-white/72 backdrop-blur-[6px]',
        'border border-white/40',
        'shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
        // Avatar corner placement may need extra outline for busy backgrounds
        placement === 'avatar-corner' && 'ring-2 ring-background',
        config.disk,
        className
      )}
      title="Verified"
      aria-label="Verified"
    >
      {/* Green tick - crisp, no glass effect */}
      <CheckCircle 
        className={cn(config.icon, 'text-emerald-500')} 
        strokeWidth={2.5}
      />
    </span>
  );
}

export default VerifiedBadge;
