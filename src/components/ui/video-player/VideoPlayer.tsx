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
  videoIconType?: 'play' | 'maximize';
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
  videoIconType = 'play',
  videoId,
  showMuteButton = true,
  isInFeed = false,
  videoRef: externalVideoRef
}) => {
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  
  // Generate thumbnail for better UX
  const thumbnailId = videoId || `video-${src.split('/').pop()?.split('.')[0] || 'unknown'}`;
  const { thumbnailSrc, thumbnailReady, thumbnailError } = useThumbnailGenerator(src, thumbnailId, poster);
  
  // Use generated thumbnail or provided poster - no fallback placeholder
  const effectivePoster = (thumbnailReady && thumbnailSrc) ? thumbnailSrc : poster;

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

  const handleVideoClick = (e: React.MouseEvent) => {
    console.log('🎬 Video click detected:', { isInFeed, event: e.type, target: e.target });
    
    // Completely disable all video clicks when in feed
    if (isInFeed) {
      console.log('🚫 Video click blocked - in feed mode');
      e.preventDefault();
      e.stopPropagation();
      return; // Do nothing for feed videos
    }
    
    // Only handle clicks if not in feed
    if (onClick) {
      onClick();
    } else {
      togglePlayPause(e);
    }
  };

  // Debug function to log all touch events
  const logTouchEvent = (eventType: string) => (e: React.TouchEvent) => {
    console.log(`📱 Touch event: ${eventType}`, { isInFeed, touches: e.touches.length });
    if (isInFeed) {
      console.log('🚫 Touch event blocked - in feed mode');
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => !isInFeed && setShowControls(true)}
      onMouseLeave={() => !isInFeed && setShowControls(false)}
    >
      {/* Show loading spinner if no thumbnail is ready and no poster */}
      {!thumbnailReady && !poster && (
        <div className="absolute inset-0 bg-media-loading animate-pulse rounded-[inherit] flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground/70 rounded-full animate-spin" />
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={effectivePoster}
        className={`w-full h-full object-cover bg-media-loading ${isInFeed ? 'pointer-events-none touch-none select-none' : 'cursor-pointer'}`}
        data-video-id={videoId}
        playsInline
        muted={muted}
        loop={loop}
        autoPlay={autoplay}
        preload="metadata"
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={false}
        disablePictureInPicture={isInFeed}
        onClick={isInFeed ? (e) => { console.log('🚫 Video onClick blocked'); e.preventDefault(); e.stopPropagation(); } : handleVideoClick}
        onMouseDown={isInFeed ? (e) => { console.log('🚫 Video onMouseDown blocked'); e.preventDefault(); e.stopPropagation(); } : undefined}
        onMouseUp={isInFeed ? (e) => { console.log('🚫 Video onMouseUp blocked'); e.preventDefault(); e.stopPropagation(); } : undefined}
        onTouchStart={isInFeed ? logTouchEvent('touchstart') : undefined}
        onTouchEnd={isInFeed ? logTouchEvent('touchend') : undefined}
        onTouchMove={isInFeed ? logTouchEvent('touchmove') : undefined}
        onTouchCancel={isInFeed ? logTouchEvent('touchcancel') : undefined}
        onContextMenu={isInFeed ? (e) => { console.log('🚫 Video onContextMenu blocked'); e.preventDefault(); e.stopPropagation(); } : undefined}
        onPointerDown={isInFeed ? (e) => { console.log('🚫 Video onPointerDown blocked'); e.preventDefault(); e.stopPropagation(); } : undefined}
        onPointerUp={isInFeed ? (e) => { console.log('🚫 Video onPointerUp blocked'); e.preventDefault(); e.stopPropagation(); } : undefined}
        style={isInFeed ? { touchAction: 'none', userSelect: 'none', pointerEvents: 'none' } : undefined}
      />

      <VideoIcon show={showVideoIcon} iconType={videoIconType} />

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