import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInContentProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * FadeInContent - Phase 9 UX Polish
 * 
 * Wraps content in a subtle fade-in animation when it first loads.
 * Uses design system motion tokens for consistent transitions.
 * 
 * Only animates on initial mount - subsequent updates keep content stable.
 */
export const FadeInContent: React.FC<FadeInContentProps> = ({ 
  children, 
  className,
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility to allow skeleton to be seen if needed
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-opacity duration-motion-fast ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};
