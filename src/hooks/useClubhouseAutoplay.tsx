import { useEffect, useRef, useCallback, useState } from 'react';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';

interface UseClubhouseAutoplayProps {
  postId: string;
  index: number;
  hasVideo: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useClubhouseAutoplay = ({ 
  postId, 
  index, 
  hasVideo, 
  videoRef 
}: UseClubhouseAutoplayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pauseAllOtherVideos } = useVideoPlaybackManager();

  // Check if this is a 3rd video (index 2, 5, 8, 11, etc.)
  const shouldAutoplay = hasVideo && (index + 1) % 3 === 0;
  
  // Debug logging
  console.log(`🎯 Post ${postId} - Index: ${index}, Should autoplay: ${shouldAutoplay}, Has video: ${hasVideo}`);

  // Intersection Observer for visibility detection
  useEffect(() => {
    if (!containerRef.current || !shouldAutoplay) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.5, // Video must be 50% visible
        rootMargin: '-10px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [shouldAutoplay]);

  // Handle autoplay logic
  useEffect(() => {
    if (!videoRef.current || !shouldAutoplay) return;

    const video = videoRef.current;

    if (isVisible && !isPlaying && shouldAutoplay) {
      console.log(`▶️ Starting autoplay for post ${postId} at index ${index}`);
      // Pause all other videos first
      pauseAllOtherVideos(postId);
      
      // Start autoplay
      video.muted = true; // Ensure muted for autoplay
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log('Autoplay failed:', error);
        });
    } else if (!isVisible && isPlaying && shouldAutoplay) {
      console.log(`⏸️ Pausing autoplay for post ${postId} at index ${index}`);
      // Pause when out of view
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, shouldAutoplay, postId, videoRef, pauseAllOtherVideos, isPlaying]);

  // Manual play handler for non-autoplay videos
  const handleManualPlay = useCallback(() => {
    if (!videoRef.current || shouldAutoplay) return;

    const video = videoRef.current;
    if (video.paused) {
      pauseAllOtherVideos(postId);
      video.play().catch(console.error);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [shouldAutoplay, postId, videoRef, pauseAllOtherVideos]);

  // Listen for video events
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef]);

  return {
    containerRef,
    shouldAutoplay,
    isPlaying,
    isVisible,
    handleManualPlay
  };
};