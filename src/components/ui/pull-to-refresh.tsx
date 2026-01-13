import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number;
}

export function PullToRefreshIndicator({
  isRefreshing,
  pullDistance,
  pullProgress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="absolute left-0 right-0 flex items-center justify-center overflow-hidden z-10"
      style={{ 
        top: 0,
        height: pullDistance,
        transition: isRefreshing ? 'height 0.2s ease-out' : 'none',
      }}
    >
      <div 
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full bg-background shadow-md border border-border',
          isRefreshing && 'animate-spin'
        )}
        style={{
          transform: `rotate(${pullProgress * 360}deg)`,
          opacity: Math.min(pullProgress * 1.5, 1),
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary" />
        ) : (
          <svg 
            className="w-5 h-5 text-primary" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

// Wrapper component for pull-to-refresh lists
interface PullToRefreshContainerProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefreshContainer({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshContainerProps) {
  const {
    containerRef,
    handlers,
    isRefreshing,
    pullDistance,
    pullProgress,
  } = usePullToRefresh({ onRefresh, disabled });

  return (
    <div
      ref={containerRef}
      {...handlers}
      className={cn('relative overflow-y-auto', className)}
    >
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        pullProgress={pullProgress}
      />
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
