import { useEffect, useRef, useState } from 'react';

interface UseAutoplayVideoProps {
  shouldAutoplay: boolean;
  isVisible?: boolean;
}

export const useAutoplayVideo = ({ shouldAutoplay, isVisible = true }: UseAutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldAutoplay && isVisible) {
      video.muted = true;
      video.loop = true;
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [shouldAutoplay, isVisible]);

  return {
    videoRef,
    isPlaying
  };
};