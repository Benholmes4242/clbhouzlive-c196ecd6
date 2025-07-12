import React, { Suspense, lazy, ComponentType } from 'react';
import { cn } from '@/lib/utils';

interface LazyComponentLoaderProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ComponentType;
  className?: string;
  props?: any;
}

/**
 * Generic lazy component loader with error boundary and loading states
 */
export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({
  factory,
  fallback: Fallback,
  className,
  props = {},
}) => {
  const LazyComponent = lazy(factory);

  const DefaultFallback = () => (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <Suspense fallback={Fallback ? <Fallback /> : <DefaultFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyComponentLoader;