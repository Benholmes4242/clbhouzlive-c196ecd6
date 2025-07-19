import React, { useRef, useEffect, useCallback } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoManagerContext } from '@/contexts/VideoManagerContext';

interface ManagedVideoPlayerProps {
  id: string;
  src: string;
  className?: string;
  disableAudio?: boolean; // New prop to disable audio functionality
}

/**
 * Video player component that's managed by the video manager
 * Only plays when in viewport and follows the single-video-audio rule
 */
const ManagedVideoPlayer: React.FC<ManagedVideoPlayerProps> = ({
  id,
  src,
  className = '',
  disableAudio = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { handleVideoInView, registerVideo, unregisterVideo } = disableAudio ? 
    { handleVideoInView: () => {}, registerVideo: () => {}, unregisterVideo: () => {} } : 
    useVideoManagerContext();
  
  // Use intersection observer to detect when video is in viewport
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5, // Video must be 50% visible
    rootMargin: '0px'
  });

  // Handle video element being ready
  const handleVideoLoaded = useCallback(() => {
    if (disableAudio) return; // Skip video manager when audio is disabled
    
    // Find the video element within the EnhancedVideoPlayer
    const container = containerRef.current;
    if (container) {
      const videoElement = container.querySelector('video') as HTMLVideoElement;
      if (videoElement && !videoRef.current) {
        videoRef.current = videoElement;
        registerVideo(id, videoElement);
      }
    }
  }, [id, registerVideo, containerRef, disableAudio]);

  // Handle viewport changes
  useEffect(() => {
    if (!disableAudio && videoRef.current) {
      handleVideoInView(id, isInView);
    }
  }, [id, isInView, handleVideoInView, disableAudio]);

  // Check for video element periodically until found
  useEffect(() => {
    if (disableAudio || videoRef.current) return; // Skip when audio disabled or video already found
    
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
  }, [id, registerVideo, containerRef, disableAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!disableAudio) {
        unregisterVideo(id);
      }
    };
  }, [id, unregisterVideo, disableAudio]);


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