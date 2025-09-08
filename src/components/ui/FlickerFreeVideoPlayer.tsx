import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { safePlay, isIOS } from '@/utils/safePlay';

interface FlickerFreeVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
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
  muted = true,
  loop = false,
  className = '',
  objectFit = 'cover',
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

  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current!, []);

  // Sync muted state
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Handle autoplay when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || !isVideoReady) return;

    const playVideo = async () => {
      const success = await safePlay(video);
      if (success) {
        setIsPlaying(true);
        onPlay?.();
      }
    };

    playVideo();
  }, [autoplay, isVideoReady, onPlay]);

  // Video event handlers
  const handleVideoReady = () => {
    const video = videoRef.current;
    if (!video) return;

    // Apply iOS nudge on loadeddata before potential autoplay
    if (isIOS && video.currentTime === 0) {
      try {
        video.currentTime = 0.001;
      } catch {
        // Ignore errors setting currentTime
      }
    }

    // Video is ready when it has loaded enough data to play
    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
      setIsVideoReady(true);
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