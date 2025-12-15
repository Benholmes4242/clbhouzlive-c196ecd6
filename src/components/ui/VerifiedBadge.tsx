import { Check } from 'lucide-react';
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
  sm: { disk: 'w-[14px] h-[14px]', ring: 'w-[10px] h-[10px]', icon: 8 },
  md: { disk: 'w-4 h-4', ring: 'w-3 h-3', icon: 10 },
  lg: { disk: 'w-[18px] h-[18px]', ring: 'w-[14px] h-[14px]', icon: 11 },
  xl: { disk: 'w-5 h-5', ring: 'w-4 h-4', icon: 13 },
};

/**
 * Unified Verified Badge - Frosted glass disk with green ring and tick
 * 
 * Visual spec (light UI):
 * - Base: rgba(255,255,255,0.85) with backdrop-blur(8px)
 * - Border: 1px solid rgba(31,36,40,0.10)
 * - Inner: Green ring (#34C759) with white tick inside
 * 
 * Used across personal profiles, business profiles, notifications, and lists.
 * This is the ONLY verified badge component - no shields, no variations.
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
        // Frosted glass disk base
        'inline-flex items-center justify-center rounded-full shrink-0',
        // Avatar corner placement may need extra outline for busy backgrounds
        placement === 'avatar-corner' && 'ring-2 ring-background',
        config.disk,
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(31, 36, 40, 0.10)',
        boxShadow: '0 2px 8px rgba(31, 36, 40, 0.06)',
      }}
      title="Verified"
      aria-label="Verified"
    >
      {/* Green ring with white tick inside */}
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.ring
        )}
        style={{ backgroundColor: '#34C759' }}
      >
        <Check 
          size={config.icon}
          className="text-white" 
          strokeWidth={3}
        />
      </span>
    </span>
  );
}

export default VerifiedBadge;
