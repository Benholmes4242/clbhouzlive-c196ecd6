/**
 * LazySection — IntersectionObserver-based lazy mount wrapper.
 * Mounts children only when the section approaches the viewport.
 * FIX 23: Reduces initial render cost for below-the-fold sections.
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  /** Minimum height for the placeholder to prevent layout shift */
  minHeight?: number;
}

export function LazySection({ children, rootMargin = '200px', minHeight = 200 }: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  if (isVisible) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} style={{ minHeight }} className="flex items-center justify-center px-4">
      <div className="w-full space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
