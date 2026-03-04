/**
 * FullscreenControls - Video progress bar for fullscreen playback
 * 
 * Uses the unified VideoScrubber component for visual and interaction parity
 * across all surfaces (feed, wizard, fullscreen).
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { VideoScrubber } from '@/components/video/VideoScrubber';

export interface FullscreenControlsProps {
  className?: string;
}

export const FullscreenControls: React.FC<FullscreenControlsProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const videoEl = viewer.activeVideoRef?.current ?? null;
  const isVideo = viewer.currentItem?.mediaType === 'video';

  if (!isVideo) return null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 z-[95] pointer-events-auto px-4',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <VideoScrubber
        videoEl={videoEl}
        variant="fullscreen"
        height={3}
      />
    </div>
  );
};

export default FullscreenControls;
