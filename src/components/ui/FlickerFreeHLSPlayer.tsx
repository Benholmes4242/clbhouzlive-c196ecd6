import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface FlickerFreeHLSPlayerProps {
  hlsUrl: string;
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
  externallyManaged?: boolean;
}

declare global {
  interface Window {
    Hls: any;
  }
}

const FlickerFreeHLSPlayer = forwardRef<HTMLVideoElement, FlickerFreeHLSPlayerProps>(({
  hlsUrl,
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
  onEnded,
  externallyManaged = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const hlsInstanceRef = useRef<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHLSLoaded, setIsHLSLoaded] = useState(false);

  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current!, []);

  // Sync muted state
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Check if browser supports native HLS
  const canPlayHLSNatively = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  };

  // Load hls.js library
  const loadHlsJs = async () => {
    if (window.Hls) return window.Hls;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
      script.onload = () => resolve(window.Hls);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Setup HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl || isHLSLoaded) return;

    const setupHLS = async () => {
      try {
        if (canPlayHLSNatively()) {
          video.src = hlsUrl;
          setIsHLSLoaded(true);
        } else {
          const Hls = await loadHlsJs();
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 10,
              backBufferLength: 5,
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS error:', data);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsHLSLoaded(true);
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hlsInstanceRef.current = hls;
          }
        }
      } catch (error) {
        console.error('Error setting up HLS:', error);
      }
    };

    setupHLS();

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [hlsUrl, isHLSLoaded]);

  // Handle autoplay when both HLS and video are ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || !isVideoReady || !isHLSLoaded) return;

    const playVideo = async () => {
      // Add delay for first-visit initialization
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let retries = 3;
      while (retries > 0) {
        try {
          await video.play();
          setIsPlaying(true);
          onPlay?.();
          break;
        } catch (error) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.warn('Autoplay failed after retries:', error);
          }
        }
      }
    };

    playVideo();
  }, [autoplay, isVideoReady, isHLSLoaded, onPlay]);

  // Handle external autoplay control
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !externallyManaged || !isHLSLoaded) return;

    if (autoplay && !isPlaying) {
      video.play().catch(console.warn);
    } else if (!autoplay && isPlaying) {
      video.pause();
    }
  }, [autoplay, externallyManaged, isHLSLoaded, isPlaying]);

  // Video event handlers
  const handleVideoReady = () => {
    const video = videoRef.current;
    if (!video) return;

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
    if (externallyManaged) {
      onClick?.();
      return;
    }

    const video = videoRef.current;
    if (!video || !isHLSLoaded) return;

    if (video.paused) {
      video.play().catch(console.warn);
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
    <div className={`relative overflow-hidden bg-black ${className}`}>
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
        className={`w-full h-full ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        playsInline
        muted={isMuted}
        loop={loop}
        controls={false}
        preload="metadata"
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

FlickerFreeHLSPlayer.displayName = 'FlickerFreeHLSPlayer';

export default FlickerFreeHLSPlayer;