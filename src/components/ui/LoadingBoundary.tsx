import React from 'react';
import { cn } from '@/lib/utils';
import { ClbhouzLoadingSpinner } from './ClbhouzLoadingSpinner';

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
  
  // Map LoadingBoundary variants to ClbhouzLoadingSpinner variants
  const spinnerVariant = variant === 'grid' ? 'light' : 'dark';
  
  return (
    <div 
      className={cn(
        'flex items-center justify-center',
        variants[variant],
        className
      )}
    >
      <ClbhouzLoadingSpinner 
        variant={spinnerVariant}
        size="md"
        message={message}
      />
    </div>
  );
}

export default LoadingBoundary;
