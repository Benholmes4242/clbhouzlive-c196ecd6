import React from 'react';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoPlayer } from './useVideoPlayer';
import { VideoIcon } from './VideoIcon';
import { VideoControls } from './VideoControls';
import { VideoCornerControls } from './VideoCornerControls';

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
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  
  // Generate thumbnail for better UX
  const thumbnailId = videoId || `video-${src.split('/').pop()?.split('.')[0] || 'unknown'}`;
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, thumbnailId, poster);
  
  // Use generated thumbnail, provided poster, or default placeholder to prevent black screens
  const defaultPoster = 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=400&fit=crop&crop=center';
  const effectivePoster = (thumbnailReady && thumbnailSrc) ? thumbnailSrc : (poster || defaultPoster);

  const {
    videoRef: internalVideoRef,
    isPlaying,
    isMuted,
    showControls,
    setShowControls,
    togglePlayPause,
    toggleMute,
    handleFullscreen
  } = useVideoPlayer({
    src,
    autoplay,
    muted,
    loop,
    onPlay,
    onPause,
    isInFeed,
    isGloballyMuted,
    setGlobalMute
  });

  const videoRef = externalVideoRef || internalVideoRef;

  const handleVideoClick = () => {
    // Only handle clicks if not in feed (let MediaContainer handle feed interactions)
    if (!isInFeed) {
      if (onClick) {
        onClick();
      } else {
        togglePlayPause({} as React.MouseEvent);
      }
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
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        muted={muted}
        loop={loop}
        autoPlay={autoplay}
        preload="metadata"
        webkit-playsinline="true"
        x5-playsinline="true"
        onClick={handleVideoClick}
      />

      <VideoIcon show={showVideoIcon} />

      <VideoControls
        isPlaying={isPlaying}
        showControls={showControls}
        onTogglePlayPause={togglePlayPause}
        show={showOverlayControls}
      />

      <VideoCornerControls
        isMuted={isMuted}
        showControls={showControls}
        isInFeed={isInFeed}
        onToggleMute={toggleMute}
        onFullscreen={handleFullscreen}
        show={showOverlayControls}
        showMuteButton={showMuteButton}
      />
    </div>
  );
};

export default VideoPlayer;