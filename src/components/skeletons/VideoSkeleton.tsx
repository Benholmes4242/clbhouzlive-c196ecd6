import React from 'react';
import { cn } from '@/lib/utils';

interface VideoSkeletonProps {
  className?: string;
  showReconnecting?: boolean;
}

export function VideoSkeleton({ className, showReconnecting = false }: VideoSkeletonProps) {
  return (
    <div className={cn(
      "w-full h-full bg-muted animate-pulse relative rounded-lg overflow-hidden",
      className
    )}>
      {/* Play button placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-muted-foreground/20" />
      </div>
      
      {/* Bottom controls placeholder */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/50 to-transparent" />
      
      {/* Reconnecting indicator */}
      {showReconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-foreground text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
