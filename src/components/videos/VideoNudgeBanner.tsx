/**
 * VideoNudgeBanner - Subtle nudge banners for video engagement
 * 
 * Shows one-time helpful hints to users:
 * - Follow creators
 * - Use queue
 * - Queue reminder
 */

import React from 'react';
import { X, UserPlus, ListPlus, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NudgeType } from '@/hooks/useVideoNudges';

interface VideoNudgeBannerProps {
  type: NudgeType;
  message: string;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const VideoNudgeBanner: React.FC<VideoNudgeBannerProps> = ({
  type,
  message,
  onDismiss,
  onAction,
  actionLabel,
  className,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'follow-creators':
      case 'follow-specific-creator':
        return <UserPlus className="h-4 w-4 shrink-0" />;
      case 'use-queue':
        return <ListPlus className="h-4 w-4 shrink-0" />;
      case 'queue-reminder':
        return <PlayCircle className="h-4 w-4 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "bg-primary/10 border border-primary/20",
        "animate-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div className="text-primary">
        {getIcon()}
      </div>
      
      <p className="flex-1 text-sm text-foreground">
        {message}
      </p>

      {onAction && actionLabel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          {actionLabel}
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default VideoNudgeBanner;
