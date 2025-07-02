
import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="space-y-6 pb-20">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-4">
          {/* User header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>
          
          {/* Media placeholder */}
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
