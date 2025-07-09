import React, { useRef, useEffect, useState } from 'react';
import { VolumeX, Volume2, Maximize, MapPin } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  courseName?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, courseName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Restore mute preference from localStorage
    const savedMuteState = localStorage.getItem('clbhouzMute') !== 'false';
    setIsMuted(savedMuteState);
    video.muted = savedMuteState;

    // Intersection Observer for autoplay
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    localStorage.setItem('clbhouzMute', newMutedState ? 'true' : 'false');
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        className="feed-video w-full h-full object-cover object-center"
        loop
        playsInline
        onError={() => {
          console.error('Video failed to load:', src);
        }}
      />
      
      {/* Course Tag */}
      {courseName && (
        <div className="course-tag absolute top-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {courseName}
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mute/Unmute Button - Top Left */}
        <button
          onClick={toggleMute}
          className="absolute top-2 left-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/70"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Fullscreen Button - Bottom Right */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/70"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;