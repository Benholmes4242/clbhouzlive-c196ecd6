import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { safePlayAfterAnimation, safePlay, isIOS } from '@/utils/safePlay';

interface FlickerFreeVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  playsInline?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain';
  showMuteButton?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
}

const FlickerFreeVideoPlayer = forwardRef<HTMLVideoElement, FlickerFreeVideoPlayerProps>(({
  src,
  poster,
  autoplay = false,
  playsInline = true,
  muted = true,
  loop = false,
  className = '',
  objectFit = 'contain',
  showMuteButton = false,
  onPlay,
  onPause,
  onClick,
  onEnded
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);

  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current!, []);

  // Sync muted state
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Idempotent autoplay handler
  const handleAutoplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !autoplay || autoplayAttempted || isPlaying) return;
    
    console.log('[VideoPlayer] Triggering autoplay handler');
    setAutoplayAttempted(true);
    
    const success = await safePlayAfterAnimation(video);
    if (success) {
      setIsPlaying(true);
      onPlay?.();
    }
  }, [autoplay, autoplayAttempted, isPlaying, onPlay]);

  // Handle autoplay when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || !isVideoReady || autoplayAttempted) return;

    handleAutoplay();
  }, [autoplay, isVideoReady, autoplayAttempted, handleAutoplay]);

  // Add visibility change handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Pause when hidden
        if (!video.paused) {
          console.log('[VideoPlayer] Document hidden, pausing video');
          video.pause();
        }
      } else {
        // Resume when visible if autoplay is enabled and video should be playing
        if (autoplay && video.paused && !video.getAttribute('data-autoplay-blocked')) {
          console.log('[VideoPlayer] Document visible, attempting to resume video');
          const success = await safePlay(video);
          if (success) {
            setIsPlaying(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoplay]);

  // Video event handlers
  const handleVideoReady = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoPlayer] Video ready event fired');

    // Apply iOS nudge on loadeddata before potential autoplay
    if (isIOS && video.currentTime === 0) {
      try {
        video.currentTime = 0.001;
      } catch {
        // Ignore errors setting currentTime
      }
    }

    // Video is ready when it has loaded enough data to play
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
      setIsVideoReady(true);
      // Trigger autoplay handler
      handleAutoplay();
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleVideoWaiting = () => {
    console.log('[VideoPlayer] Video waiting/stalled');
    // Minimal handling: just log for now as requested
  };

  const handleVideoStalled = () => {
    console.log('[VideoPlayer] Video stalled');
    // Minimal handling: just log for now as requested
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      safePlay(video);
    } else {
      video.pause();
    }
    
    onClick?.();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  // Determine poster visibility: show until video is playing
  const showPoster = !isPlaying && poster && isPosterLoaded;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Poster Image - stays visible until video starts playing */}
      {poster && (
        <img
          ref={posterRef}
          src={poster}
          alt="Video poster"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          } ${showPoster ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          onLoad={() => setIsPosterLoaded(true)}
          onError={() => setIsPosterLoaded(false)}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className={`feed-card-video w-full h-full ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        muted
        autoPlay={autoplay}
        playsInline
        webkit-playsinline="true"
        loop={loop}
        preload="metadata"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        poster={poster}
        onLoadedData={handleVideoReady}
        onCanPlay={handleVideoReady}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onWaiting={handleVideoWaiting}
        onStalled={handleVideoStalled}
        onEnded={onEnded}
        onClick={handleVideoClick}
      />

      {/* Mute Button */}
      {showMuteButton && (
        <button
          className="absolute top-2 right-2 bg-black/50 text-white border-0 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-20"
          onClick={toggleMute}
          aria-label="Toggle sound"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
});

FlickerFreeVideoPlayer.displayName = 'FlickerFreeVideoPlayer';

export default FlickerFreeVideoPlayer;