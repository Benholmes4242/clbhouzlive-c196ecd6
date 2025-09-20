import React from 'react';
import { cn } from '@/lib/utils';

interface AccessibleMediaDisplayProps {
  children: React.ReactNode;
  className?: string;
  reduceMotion?: boolean;
}

const AccessibleMediaDisplay: React.FC<AccessibleMediaDisplayProps> = ({ 
  children, 
  className,
  reduceMotion 
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldReduceMotion = reduceMotion || prefersReducedMotion;

  return (
    <div 
      className={cn(
        "transition-all duration-200",
        shouldReduceMotion && "transition-none",
        className
      )}
      style={{
        ...(shouldReduceMotion && {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important'
        })
      }}
    >
      {children}
    </div>
  );
};

export default AccessibleMediaDisplay;