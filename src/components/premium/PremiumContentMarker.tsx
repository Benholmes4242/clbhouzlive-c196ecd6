/**
 * PremiumContentMarker - Phase 8: Internal premium flagging
 * No forced upsells, just structural readiness
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumContentMarkerProps {
  /** Whether this content is flagged as premium */
  isPremium?: boolean;
  /** Show the premium label (only when needed) */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

/**
 * Wrapper component for premium content.
 * Currently just renders children - premium logic added later.
 */
export const PremiumContentMarker: React.FC<PremiumContentMarkerProps> = ({
  isPremium = false,
  showLabel = false,
  size = 'sm',
  className,
  children,
}) => {
  // For now, always render content (no blocking)
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {/* Subtle premium indicator (only when explicitly shown) */}
      {isPremium && showLabel && (
        <div 
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100",
            size === 'sm' && "text-xs",
            size === 'md' && "text-sm"
          )}
        >
          <Sparkles className={cn("text-amber-500", size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
          <span className="text-amber-700 font-medium">Premium</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to check premium content access (future-proofing)
 */
export function usePremiumAccess() {
  // TODO: Connect to subscription system
  return {
    hasPremium: false,
    isLoading: false,
  };
}

export default PremiumContentMarker;
