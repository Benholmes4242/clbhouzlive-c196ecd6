import React from 'react';
import { Play, ImageOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaErrorFallbackProps {
  onRetry: () => void;
  isVideo: boolean;
  canRetry?: boolean;
  className?: string;
}

/**
 * Premium error fallback with soft, branded styling
 * Replaces harsh "Failed to load" text with friendly retry card
 */
const MediaErrorFallback: React.FC<MediaErrorFallbackProps> = ({
  onRetry,
  isVideo,
  canRetry = true,
  className
}) => {
  return (
    <button
      type="button"
      onClick={canRetry ? onRetry : undefined}
      disabled={!canRetry}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        "bg-muted/20 backdrop-blur-sm",
        "transition-all duration-200",
        canRetry && "cursor-pointer hover:bg-muted/30 active:scale-[0.98]",
        !canRetry && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {/* Icon container */}
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        "bg-slate-500/10"
      )}>
        {isVideo ? (
          <Play className="h-5 w-5 text-slate-500" />
        ) : (
          <ImageOff className="h-5 w-5 text-slate-500" />
        )}
      </div>
      
      {/* Retry text */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {canRetry ? (
          <>
            <RefreshCw className="h-3 w-3" />
            <span>Tap to reload</span>
          </>
        ) : (
          <span>Unable to load media</span>
        )}
      </div>
    </button>
  );
};

export default MediaErrorFallback;
