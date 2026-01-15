/**
 * Phase 5 Perf: Reusable Suspense Boundary with fallback
 * Provides consistent loading states and error handling
 */

import React, { Suspense, ReactNode, ComponentType } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

interface SuspenseBoundaryProps {
  children: ReactNode;
  /** Custom loading fallback */
  fallback?: ReactNode;
  /** Name for debugging/logging */
  name?: string;
  /** Show minimal skeleton (for nested suspense) */
  minimal?: boolean;
}

// Default loading skeleton
const DefaultSkeleton: React.FC<{ minimal?: boolean }> = ({ minimal }) => {
  if (minimal) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="animate-pulse p-4 space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
};

// Error fallback component
const ErrorFallback: React.FC<FallbackProps & { name?: string }> = ({ 
  error, 
  resetErrorBoundary,
  name 
}) => {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <h3 className="font-medium text-destructive mb-2">
        Something went wrong{name ? ` in ${name}` : ''}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
};

/**
 * Suspense boundary with error handling
 * Use for data-fetching boundaries in the component tree
 * 
 * Usage:
 * ```tsx
 * <SuspenseBoundary name="UserProfile">
 *   <UserProfileContent />
 * </SuspenseBoundary>
 * ```
 */
export const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({
  children,
  fallback,
  name,
  minimal = false,
}) => {
  const loadingFallback = fallback ?? <DefaultSkeleton minimal={minimal} />;

  return (
    <ErrorBoundary
      FallbackComponent={(props) => <ErrorFallback {...props} name={name} />}
      onError={(error) => {
        console.error(`Error in SuspenseBoundary${name ? ` (${name})` : ''}:`, error);
      }}
    >
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * HOC to wrap a component with Suspense boundary
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  options?: Omit<SuspenseBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <SuspenseBoundary {...options}>
      <Component {...props} />
    </SuspenseBoundary>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

export default SuspenseBoundary;
