import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { VideoControls } from './VideoControls';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  showOverlayControls?: boolean;
  showVideoIcon?: boolean;
  videoId?: string; // Add videoId for thumbnail generation
  showMuteButton?: boolean; // Control whether to show mute button in top-left
  isInFeed?: boolean; // Indicates if this video is in the main feed
  videoRef?: React.RefObject<HTMLVideoElement>; // Allow external ref
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  muted = true,
  loop = true,
  controls = false,
  className = '',
  onPlay,
  onPause,
  onClick,
  showOverlayControls = true,
  showVideoIcon = false,
  videoId,
  showMuteButton = true,
  isInFeed = false,
  videoRef: externalVideoRef
}) => {
  const [showControls, setShowControls] = useState(false);
  
  // Generate thumbnail for better UX
  const thumbnailId = videoId || `video-${src.split('/').pop()?.split('.')[0] || 'unknown'}`;
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, thumbnailId, poster);
  
  // Use generated thumbnail or fallback to provided poster
  const effectivePoster = thumbnailReady && thumbnailSrc ? thumbnailSrc : poster;

  const {
    videoRef,
    isPlaying,
    isMuted,
    togglePlayPause,
    toggleMute,
    handleFullscreen
  } = useVideoPlayer({
    src,
    autoplay,
    muted,
    loop,
    isInFeed,
    onPlay,
    onPause,
    videoRef: externalVideoRef
  });

  const handleVideoClick = (e: React.MouseEvent) => {
    // For feed videos with autoplay, only allow clicks for fullscreen via onClick prop
    if (isInFeed && autoplay) {
      if (onClick) {
        onClick(); // This should be fullscreen functionality
      }
      return;
    }
    
    if (onClick) {
      onClick();
    } else {
      // Allow video click to toggle play/pause for non-feed videos
      togglePlayPause(e);
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={effectivePoster}
        className={`w-full h-full object-cover ${isInFeed && autoplay ? 'pointer-events-none' : 'cursor-pointer'}`}
        playsInline
        muted={muted}
        loop={loop}
        preload="metadata"
        webkit-playsinline="true"
        x5-playsinline="true"
        onClick={handleVideoClick}
      />

      {/* Video Icon Overlay */}
      {showVideoIcon && (
        <div className="absolute bottom-2 right-2 bg-black/70 rounded-full p-1.5">
          <Play className="h-3 w-3 text-white fill-white" />
        </div>
      )}

      {/* Video Controls */}
      <VideoControls
        isPlaying={isPlaying}
        isMuted={isMuted}
        showControls={showControls}
        showOverlayControls={showOverlayControls}
        showMuteButton={showMuteButton}
        isInFeed={isInFeed}
        onTogglePlayPause={togglePlayPause}
        onToggleMute={toggleMute}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
};

export default VideoPlayer;