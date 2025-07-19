import React, { useRef, useEffect, useCallback } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoManagerContext } from '@/contexts/VideoManagerContext';

interface ManagedVideoPlayerProps {
  id: string;
  src: string;
  className?: string;
  onMuteStateChange?: (isMuted: boolean) => void;
}

/**
 * Video player component that's managed by the video manager
 * Only plays when in viewport and follows the single-video-audio rule
 */
const ManagedVideoPlayer: React.FC<ManagedVideoPlayerProps> = ({
  id,
  src,
  className = '',
  onMuteStateChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const { handleVideoInView, registerVideo, unregisterVideo, getVideoMuteState } = useVideoManagerContext();
  
  // Use intersection observer to detect when video is in viewport
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5, // Video must be 50% visible
    rootMargin: '0px'
  });

  // Handle video element being ready
  const handleVideoLoaded = useCallback(() => {
    // Find the video element within the EnhancedVideoPlayer
    const container = containerRef.current;
    if (container) {
      const videoElement = container.querySelector('video') as HTMLVideoElement;
      if (videoElement && !videoRef.current) {
        videoRef.current = videoElement;
        registerVideo(id, videoElement);
      }
    }
  }, [id, registerVideo, containerRef]);

  // Handle viewport changes
  useEffect(() => {
    if (videoRef.current) {
      handleVideoInView(id, isInView);
    }
  }, [id, isInView, handleVideoInView]);

  // Check for video element periodically until found
  useEffect(() => {
    if (!videoRef.current) {
      const checkForVideo = () => {
        const container = containerRef.current;
        if (container) {
          const videoElement = container.querySelector('video') as HTMLVideoElement;
          if (videoElement) {
            videoRef.current = videoElement;
            registerVideo(id, videoElement);
            return;
          }
        }
        // Try again after a short delay
        setTimeout(checkForVideo, 100);
      };
      
      const timeout = setTimeout(checkForVideo, 100);
      return () => clearTimeout(timeout);
    }
  }, [id, registerVideo, containerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterVideo(id);
    };
  }, [id, unregisterVideo]);

  // Notify parent of mute state changes
  useEffect(() => {
    if (onMuteStateChange) {
      const isMuted = getVideoMuteState(id);
      onMuteStateChange(isMuted);
    }
  }, [id, onMuteStateChange]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <EnhancedVideoPlayer
        src={src}
        autoplay={true}
        muted={true} // Always start muted
        loop={true}
        className="w-full h-full"
        enableHLS={true}
        onPlay={handleVideoLoaded}
      />
    </div>
  );
};

export default ManagedVideoPlayer;