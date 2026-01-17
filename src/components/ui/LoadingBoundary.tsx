import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingBoundaryProps {
  /** Whether the boundary is visible */
  isVisible: boolean;
  /** Optional message to display */
  message?: string;
  /** Variant for different contexts */
  variant?: 'feed' | 'grid' | 'fullscreen';
  /** Additional className */
  className?: string;
}

export function LoadingBoundary({ 
  isVisible, 
  message,
  variant = 'feed',
  className 
}: LoadingBoundaryProps) {
  if (!isVisible) return null;
  
  const variants = {
    feed: 'h-screen bg-black', // Full height for vertical feed
    grid: 'h-48 bg-muted/20', // Row height for grid
    fullscreen: 'h-screen bg-black',
  };
  
  return (
    <div 
      className={cn(
        'flex items-center justify-center',
        variants[variant],
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Instagram-style spinner */}
        <div className="relative w-10 h-10">
          <div 
            className={cn(
              "absolute inset-0 rounded-full border-2 border-t-transparent animate-spin",
              variant === 'grid' ? 'border-muted-foreground/40' : 'border-white/30'
            )}
          />
          <div 
            className={cn(
              "absolute inset-1 rounded-full border-2 border-b-transparent animate-spin",
              variant === 'grid' ? 'border-muted-foreground/60' : 'border-white/50'
            )}
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          />
        </div>
        {message && (
          <p className={cn(
            "text-sm font-medium",
            variant === 'grid' ? 'text-muted-foreground' : 'text-white/70'
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingBoundary;
