/**
 * VideoErrorState - Error indicator when first frame fails to load
 * Shows timeout or fatal error state for paused video mode
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoErrorStateProps {
  className?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  // AUDIT FIX #5: Show retry count to help distinguish network issues from content issues
  retryCount?: number;
  maxRetries?: number;
}

export const VideoErrorState: React.FC<VideoErrorStateProps> = ({
  className,
  message = 'Unable to load video',
  onRetry,
  showRetry = true,
  retryCount,
  maxRetries = 3,
}) => {
  // Show retry info if we've attempted retries
  const showRetryInfo = typeof retryCount === 'number' && retryCount > 0;
  
  return (
    <div 
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20',
        className
      )}
      role="alert"
      aria-label={message}
    >
      <AlertCircle className="w-10 h-10 text-white/60 mb-2" />
      
      <span className="text-sm text-white/70 font-medium mb-1">
        {message}
      </span>
      
      {/* AUDIT FIX #5: Display retry count for debugging */}
      {showRetryInfo && (
        <span className="text-xs text-white/50 mb-3">
          Retry {retryCount}/{maxRetries}
        </span>
      )}
      
      {!showRetryInfo && <div className="mb-3" />}
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 
                     bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default VideoErrorState;
